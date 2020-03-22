//@ts-check

/* -----------------------------
Signaling Server to manage different SFUs
 --------------------------- */
var crypto = require('crypto');
var puppeteer = require('puppeteer');

var allStreams = {}; //Contains all the streams on this instance
var allStreamAttributes = {}; //Constains all the stream Attr (also from streams on other instances)
var loadBalancersSockets = {};

var init = function (io, newConfig = { loadBalancerAuthKey: null }) {

    var orgIceServer = JSON.parse(JSON.stringify(newConfig.webRtcConfig.iceServers));

    io.sockets.on('connection', function (socket) {
        let myStreamIds = [];
        let myRooms = {};
        console.log("new connection!", socket.id)

        socket.on("disconnect", function () {
            for (let i = 0; i < myStreamIds.length; i++) {
                if (allStreams[myStreamIds[i]]) {
                    socket.to(allStreams[myStreamIds[i]]["roomname"]).emit("sfu_onStreamUnpublished", allStreamAttributes[myStreamIds[i]]);
                    for (var k in loadBalancersSockets) {
                        loadBalancersSockets[k].emit("sfu_onStreamUnpublished", allStreamAttributes[myStreamIds[i]])
                    }
                }
                delete allStreams[myStreamIds[i]];
                delete allStreamAttributes[myStreamIds[i]];
            }
            for (let roomname in myRooms) {
                socket.to(roomname).emit("sfu_onUserDisconnectedFromRoom", socket.id);
            }
            for (var k in loadBalancersSockets) {
                loadBalancersSockets[k].emit("sfu_onUserDisconnectedFromRoom", socket.id)
            }

            for (var k in allStreamAttributes) {
                if (allStreamAttributes[k]["instanceTo"] == socket.id) { //Remove streams if loadbalancer disconnects
                    socket.to(allStreamAttributes[k]["roomname"]).emit("sfu_onStreamUnpublished", allStreamAttributes[k]);
                    delete allStreamAttributes[k];
                }
            }
            delete loadBalancersSockets[socket.id];
        });


        function getCurrentIceServers() {
            var icesevers = orgIceServer;
            var returnIce = [];
            for (var i in icesevers) {
                if (icesevers[i].turnServerCredential) { //Generate a temp user and password with this turn server creds if given
                    var turnCredentials = getTURNCredentials(icesevers[i].username, icesevers[i].turnServerCredential);
                    returnIce.push({
                        urls: icesevers[i].urls,
                        credential: turnCredentials.password,
                        username: turnCredentials.username
                    });
                } else {
                    returnIce.push(icesevers[i]);
                }
            }

            newConfig.webRtcConfig.iceServers = returnIce;
            return returnIce;

        }

        socket.emit("sfu_onIceServers", getCurrentIceServers())

        socket.on("sfu_joinRoom", function (content, callback) { //call to join a room
            var roomname = content["roomname"].trim() || "";
            myRooms[roomname] = roomname;

            if (roomname == "") {
                return console.log("error, not entered room! roomname or username is empty!")
            }

            socket.join(roomname);
            callback(getCurrentIceServers());
        });

        //Handel signaling between client and server peers
        socket.on("sfu_signaling", function (content) {
            var instanceTo = content["instanceTo"];
            if (loadBalancersSockets[instanceTo]) {
                content["clientSocketId"] = socket.id;
                loadBalancersSockets[instanceTo].emit("sfu_signaling", content);
            } else if (instanceTo == "clientSocket") {
                var clientSocketId = content["clientSocketId"];
                content["instanceFrom"] = socket.id;
                io.to(clientSocketId).emit("sfu_signaling", content);
            } else {
                console.log("instance not found at signaling:", instanceTo);
            }
        })

        socket.on("sfu_registerStream", function (streamAttributes, callback) {
            //console.log("sfu_registerStream", streamAttributes)
            if (!allStreams[streamAttributes["streamId"]]) { //Stream is not there yet
                streamAttributes["socketId"] = socket.id;
                findBestStreamingInstance(streamAttributes, function (err, instance) { //Get the destination where the user should stream to!
                    if (err) {
                        return callback(err);
                    }
                    //set streamSource attr
                    streamAttributes["instanceTo"] = instance;
                    allStreamAttributes[streamAttributes["streamId"]] = streamAttributes;
                    myStreamIds.push(streamAttributes["streamId"]);
                    callback(null, streamAttributes);
                })
            } else {
                callback("Not a stream you own! Nothing was set!");
            }
        })

        socket.on("sfu_updateStreamAttributes", function (streamAttributes, callback) {
            //console.log("subStream", streamAttributes)
            if (allStreams[streamAttributes["streamId"]] && myStreamIds.includes(streamAttributes["streamId"])) { //Check if stream is there and owned by this user
                streamAttributes["socketId"] = socket.id;
                streamAttributes["streamSource"] = allStreamAttributes[streamAttributes["streamId"]]["streamSource"]; //Set the old streamSource back in
                allStreamAttributes[streamAttributes["streamId"]] = streamAttributes;
                callback(null, streamAttributes);
            } else {
                callback("Not a stream you own! Nothing was set!");
            }
        })

        socket.on("sfu_unpublishStream", function (streamId, callback) {
            if (myStreamIds.includes(streamId)) { //Check if stream is there and owned by this user
                if (allStreamAttributes[streamId] && allStreamAttributes[streamId]["roomname"]) { //Check if stream has attr
                    socket.to(allStreamAttributes[streamId]["roomname"]).emit("sfu_onStreamUnpublished", allStreamAttributes[streamId]);
                    for (var k in loadBalancersSockets) {
                        loadBalancersSockets[k].emit("sfu_onStreamUnpublished", allStreamAttributes[streamId])
                    }
                }
                if (allStreamAttributes[streamId]) {
                    socket.emit("sfu_onStreamUnpublished", allStreamAttributes[streamId])
                }

                delete allStreams[streamId];
                delete allStreamAttributes[streamId];
                callback();
            } else {
                callback("Not a stream you own! Nothing was set!");
            }
        })

        socket.on("sfu_getAllStreamsFromRoom", function (roomname, callback) {
            var retArr = []
            for (var lsid in allStreamAttributes) {
                if (allStreamAttributes[lsid]["roomname"] == roomname) {
                    retArr.push(allStreamAttributes[lsid]);
                }
            }
            callback(retArr);
        })

        //LOAD BALANCER STUFF
        socket.on("sfu_registerLoadBalancer", function (lbAuthKey, attributes) {
            if (newConfig["loadBalancerAuthKey"] && newConfig["loadBalancerAuthKey"] == lbAuthKey) {
                loadBalancersSockets[socket.id] = socket;
                console.log("New Loadbalancer connected: ", socket.id);
            }
        });

        socket.on("sfu_reqCurrentIceServers", function (lbAuthKey) {
            if (newConfig["loadBalancerAuthKey"] && newConfig["loadBalancerAuthKey"] == lbAuthKey) {
                socket.emit("sfu_onIceServers", getCurrentIceServers())
            }
        })

        socket.on("sfu_streamIsActive", function (lbAuthKey, content) {
            var streamId = content.streamId
            if (newConfig["loadBalancerAuthKey"] && newConfig["loadBalancerAuthKey"] == lbAuthKey) {
                if (allStreamAttributes[streamId]) {
                    allStreamAttributes[streamId].hasVideo = content.hasVideo;
                    allStreamAttributes[streamId].hasAudio = content.hasAudio;
                    allStreamAttributes[streamId]["active"] = true;
                    if (allStreamAttributes[streamId]["roomname"]) {
                        socket.to(allStreamAttributes[streamId]["roomname"]).emit("sfu_onNewStreamPublished", allStreamAttributes[streamId]); //To hole room if stream is in
                    }
                    
                    socket.emit("sfu_onNewStreamPublished", allStreamAttributes[streamId]) //to yourself
                }
            }
        })

        socket.on("sfu_reqStreamFromLB", function (content) {
            var instanceFrom = content["instanceFrom"];
            content["clientSocketId"] = socket.id;
            loadBalancersSockets[instanceFrom].emit("sfu_reqSteam", content);
        });

        socket.on("sfu_reqPeerConnectionToLB", function (content) {
            var instanceTo = content["instanceTo"];
            content["clientSocketId"] = socket.id;
            loadBalancersSockets[instanceTo].emit("sfu_reqPeerConnectionToLB", content);
        });

        //END - LOAD BALANCER STUFF
    })

    function findBestStreamingInstance(streamAttributes, callback) {
        var instanceId = null;
        for (var i in loadBalancersSockets) { //Find a fitting free loadbalancer
            instanceId = i;
        }
        if(!instanceId) {
            callback("No streaming instance found!");
        } else {
            callback(null, instanceId);
        }
        
    }
}

function getTURNCredentials(name, secret) {
    var unixTimeStamp = parseInt((Date.now() / 1000) + "") + 36 * 3600,   // this credential would be valid for the next 36 hours
        username = [unixTimeStamp, name].join(':'),
        password,
        hmac = crypto.createHmac('sha1', secret);
    hmac.setEncoding('base64');
    hmac.write(username);
    hmac.end();
    password = hmac.read();
    return {
        username: username,
        password: password
    };
}

(async function () {
    const browser = await puppeteer.launch({
        "ignoreHTTPSErrors": true,
        args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('https://127.0.0.1/webSFU/sfu.html');

    page.on('console', msg => {
        for (let i = 0; i < msg.args().length; ++i) {
            console.log('loadbalancer:', `${i}: ${msg.args()[i]}`);
        }
    });
    await page.waitFor('#loadSFUBtn');
    await page.click('body');
    await page.click('#loadSFUBtn');

    console.log("STARTED MAIN LOADBALANCER")
})()

module.exports = {
    init: init
}