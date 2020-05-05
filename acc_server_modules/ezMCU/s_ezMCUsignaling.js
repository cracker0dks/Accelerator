//@ts-check

/* -----------------------------
Signaling Server to manage different MCUs
 --------------------------- */
var crypto = require('crypto');
var puppeteer = require('puppeteer');

var allStreams = {}; //Contains all the streams on this instance
var allStreamAttributes = {}; //Constains all the stream Attr (also from streams on other instances)
var loadBalancersSockets = {};
var streamRecordSubs = {}; //All subs to a clientProcessed stream

var init = async function (io, newConfig) {
    var mcuConfig = {
        loadBalancerAuthKey: "asd"
    }
    for (var i in newConfig) {
        mcuConfig[i] = newConfig[i];
    }
    var orgIceServer = JSON.parse(JSON.stringify(mcuConfig.webRtcConfig.iceServers));

    io.sockets.on('connection', function (socket) {
        let myStreamIds = [];
        let myRooms = {};
        console.log("new connection!", socket.id)

        socket.on("disconnect", function () {
            for (let i = 0; i < myStreamIds.length; i++) {
                if (allStreams[myStreamIds[i]]) {
                    socket.to(allStreams[myStreamIds[i]]["roomname"]).emit("mcu_onStreamUnpublished", allStreamAttributes[myStreamIds[i]]);
                    for (var k in loadBalancersSockets) {
                        loadBalancersSockets[k].emit("mcu_onStreamUnpublished", allStreamAttributes[myStreamIds[i]])
                    }
                }
                delete allStreams[myStreamIds[i]];
                delete allStreamAttributes[myStreamIds[i]];
            }
            for (let roomname in myRooms) {
                socket.to(roomname).emit("mcu_onUserDisconnectedFromRoom", socket.id);
            }
            for (var k in loadBalancersSockets) {
                loadBalancersSockets[k].emit("mcu_onUserDisconnectedFromRoom", socket.id)
            }

            for (var k in allStreamAttributes) {
                if (allStreamAttributes[k]["instanceTo"] == socket.id) { //Remove streams if loadbalancer disconnects
                    socket.to(allStreamAttributes[k]["roomname"]).emit("mcu_onStreamUnpublished", allStreamAttributes[k]);
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

            mcuConfig.webRtcConfig.iceServers = returnIce;
            return returnIce;

        }

        socket.emit("mcu_onIceServers", getCurrentIceServers())

        socket.on("mcu_joinRoom", function (content, callback) { //call to join a room
            var roomname = content && content["roomname"] ? content["roomname"].trim() : "";
            myRooms[roomname] = roomname;

            if (roomname == "") {
                return console.log("error, not entered room! roomname or username is empty!")
            }

            socket.join(roomname);

            var retConfig = JSON.parse(JSON.stringify(mcuConfig.webRtcConfig));
            retConfig["processingFPS"] = mcuConfig["processingFPS"];
            retConfig["processingBitrate"] = mcuConfig["processingBitrate"];
            callback(retConfig);
        });

        //Handel signaling between client and server peers
        socket.on("mcu_signaling", function (content) {
            var instanceTo = content ? content["instanceTo"] : 0;
            if (loadBalancersSockets[instanceTo]) {
                content["clientSocketId"] = socket.id;
                loadBalancersSockets[instanceTo].emit("mcu_signaling", content);
            } else if (instanceTo == "clientSocket") {
                var clientSocketId = content["clientSocketId"];
                content["instanceFrom"] = socket.id;
                io.to(clientSocketId).emit("mcu_signaling", content);
            } else {
                console.log("instance not found at signaling:", instanceTo);
            }
        })

        socket.on("mcu_registerStream", function (streamAttributes, callback) {
            //console.log("mcu_registerStream", streamAttributes)
            var streamId = streamAttributes ? streamAttributes["streamId"] : 0;
            if (streamId && !allStreams[streamId]) { //if Stream is not there yet
                streamAttributes["socketId"] = socket.id;
                streamAttributes["streamSocketId"] = socket.id;
                allStreamAttributes[streamId] = streamAttributes;
                if (streamAttributes.clientProcessedStream && streamAttributes.hasVideo) {
                    myStreamIds.push(streamId);
                    callback(null, streamAttributes);
                    socket.to(allStreamAttributes[streamId]["roomname"]).emit("mcu_onNewStreamPublished", allStreamAttributes[streamId]); //To hole room if stream is in
                    socket.emit("mcu_onNewStreamPublished", allStreamAttributes[streamId]) //to yourself
                } else {
                    findBestStreamingInstance(streamAttributes, function (err, instance) { //Get the destination where the user should stream to!
                        if (err) {
                            return callback(err);
                        }
                        console.log(instance)
                        //set streamSource attr
                        streamAttributes["instanceTo"] = instance;
                        myStreamIds.push(streamId);
                        callback(null, streamAttributes);
                    })
                }
            } else {
                callback("Steam already there! Nothing was set!");
            }
        })

        socket.on("mcu_updateStreamAttributes", function (streamAttributes, callback) {
            //console.log("subStream", streamAttributes)

            if (streamAttributes && allStreams[streamAttributes["streamId"]] && myStreamIds.includes(streamAttributes["streamId"])) { //Check if stream is there and owned by this user
                streamAttributes["socketId"] = socket.id;
                streamAttributes["streamSource"] = allStreamAttributes[streamAttributes["streamId"]]["streamSource"]; //Set the old streamSource back in
                allStreamAttributes[streamAttributes["streamId"]] = streamAttributes;
                callback(null, streamAttributes);
            } else {
                callback("Not a stream you own! Nothing was set!");
            }
        })

        socket.on("mcu_unpublishStream", function (streamId, callback) {
            if (myStreamIds.includes(streamId)) { //Check if stream is there and owned by this user
                if (allStreamAttributes[streamId] && allStreamAttributes[streamId]["roomname"]) { //Check if stream has attr
                    socket.to(allStreamAttributes[streamId]["roomname"]).emit("mcu_onStreamUnpublished", allStreamAttributes[streamId]);
                    for (var k in loadBalancersSockets) {
                        loadBalancersSockets[k].emit("mcu_onStreamUnpublished", allStreamAttributes[streamId])
                    }
                }
                if (allStreamAttributes[streamId]) {
                    socket.emit("mcu_onStreamUnpublished", allStreamAttributes[streamId])
                }

                delete allStreams[streamId];
                delete allStreamAttributes[streamId];
                delete streamRecordSubs[streamId];
                callback();
            } else {
                callback("Not a stream you own! Nothing was set!");
            }
        })

        socket.on("mcu_getAllStreamsFromRoom", function (roomname, callback) {
            var retArr = []
            for (var lsid in allStreamAttributes) {
                if (allStreamAttributes[lsid]["roomname"] == roomname) {
                    retArr.push(allStreamAttributes[lsid]);
                }
            }
            if (typeof (callback) === "function") {
                callback(retArr);
            }
        })

        socket.on("client_vid", function (content) {
            if (content) {
                var streamId = content["streamId"];
                var d = content["d"];
                for (var i in streamRecordSubs[streamId]) {
                    io.to(i).emit("mcu_vid", { streamId: streamId, d: d });
                }
            }
        });

        //LOAD BALANCER STUFF
        socket.on("mcu_registerLoadBalancer", function (lbAuthKey, attributes) {
            if (mcuConfig["loadBalancerAuthKey"] == lbAuthKey) {
                loadBalancersSockets[socket.id] = socket;
                console.log("New Loadbalancer connected: ", socket.id);
            }
        });

        socket.on("mcu_reqCurrentIceServers", function (lbAuthKey) {
            if (mcuConfig["loadBalancerAuthKey"] && mcuConfig["loadBalancerAuthKey"] == lbAuthKey) {
                var newIceServers = getCurrentIceServers();
                socket.emit("mcu_onIceServers", newIceServers)
            }
        })

        socket.on("mcu_streamIsActive", function (lbAuthKey, content) {
            var streamId = content.streamId
            if (mcuConfig["loadBalancerAuthKey"] && mcuConfig["loadBalancerAuthKey"] == lbAuthKey) {
                if (allStreamAttributes[streamId]) {
                    allStreamAttributes[streamId].hasVideo = content.hasVideo;
                    allStreamAttributes[streamId].hasAudio = content.hasAudio;
                    allStreamAttributes[streamId].videoWidth = content.videoWidth;
                    allStreamAttributes[streamId].videoHeight = content.videoHeight;
                    allStreamAttributes[streamId]["active"] = true;
                    if (allStreamAttributes[streamId]["roomname"]) {
                        socket.to(allStreamAttributes[streamId]["roomname"]).emit("mcu_onNewStreamPublished", allStreamAttributes[streamId]); //To hole room if stream is in
                    }

                    socket.emit("mcu_onNewStreamPublished", allStreamAttributes[streamId]) //to yourself
                }
            }
        })

        socket.on("mcu_reqStreamFromLB", function (content) {
            var streamId = content && content["streamId"] ? content["streamId"].replace("{", "").replace("}", "") : 0;
            var streamAttributes = allStreamAttributes[streamId];
            if (streamAttributes && streamAttributes["clientProcessedStream"] && streamAttributes["hasVideo"]) {
                if (!streamRecordSubs[streamId]) { streamRecordSubs[streamId] = {} };
                streamRecordSubs[streamId][socket.id] = true;
            } else {
                var instanceFrom = content["instanceFrom"];
                content["clientSocketId"] = socket.id;
                if (loadBalancersSockets[instanceFrom]) { loadBalancersSockets[instanceFrom].emit("mcu_reqSteam", content); }
            }
        });

        socket.on("mcu_reqPeerConnectionToLB", function (content) {
            var instanceTo = content ? content["instanceTo"] : 0;
            content["clientSocketId"] = socket.id;
            if (loadBalancersSockets[instanceTo]) { loadBalancersSockets[instanceTo].emit("mcu_reqPeerConnectionToLB", content); }
        });

        socket.on("mcu_vid", function (content) {
            if (content) {
                var clientSocketId = content["cs"];
                var streamId = content["streamId"];
                content["clientSocketId"] = socket.id;
                io.to(clientSocketId).emit("mcu_vid", { streamId: streamId, d: content["d"] });
            }
        });

        //END - LOAD BALANCER STUFF
    })

    function findBestStreamingInstance(streamAttributes, callback) {
        var roomname = streamAttributes.roomname;
        var instanceId = null;

        var streamCntPerlb = {}; //Cnt streams per lb
        for (var i in loadBalancersSockets) {
            instanceId = i; //Set it to a latest lb in any case and keep searching
            streamCntPerlb[i] = 0;
        }

        for (var k in allStreamAttributes) {
            if (allStreamAttributes[k].roomname == roomname) { //Find the instance other people from this room are streaming to
                instanceId = allStreamAttributes[k].instanceTo;
                if (instanceId && instanceId != "") {
                    callback(null, instanceId); //Keep streams from the same room on the same server
                    console.log("SAME ROOM CALLBACK", instanceId)
                    return;
                }
            }
            streamCntPerlb[allStreamAttributes[k].instanceTo]++; //Inc stream count for this lb
        } //Finish!

        var lowestStreamCntInstanceId = null;
        for (var i in streamCntPerlb) { //Find a fitting free loadbalancer
            if (!lowestStreamCntInstanceId) {
                lowestStreamCntInstanceId = i;
            } else if (streamCntPerlb[i] < streamCntPerlb[lowestStreamCntInstanceId]) {
                lowestStreamCntInstanceId = i;
            }
        }
        if (lowestStreamCntInstanceId) {
            instanceId = lowestStreamCntInstanceId;
        }
        if (!instanceId) {
            callback("No streaming instance found!");
        } else {
            console.log("NEW LB CALLBACK", instanceId)
            callback(null, instanceId);
        }
    }

    if (mcuConfig.enableLocalMCU) {

        var masterURL = 'http://127.0.0.1:' + mcuConfig.masterPort;
        if (!mcuConfig.isMaster) { //Is loabalancer
            masterURL = mcuConfig.masterURL;
        }

        var browser;
        try {
            browser = await puppeteer.launch({
                headless: true,
                //executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
                //executablePath: 'C:/Users/Cracker/AppData/Local/Google/Chrome SxS/Application/chrome.exe',
                "ignoreHTTPSErrors": true,
                args: [
                    '--ignore-certificate-errors',
                    '--no-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-setuid-sandbox',
                    '--enable-experimental-web-platform-features'
                ]
            });
        } catch (e) {
            console.log("FAILD TO START puppeteer BROWSER!!!", e)
        }

        if (browser) {
            var mcuStartedWithoutError = false;
            async function startUpMcu() {
                const page = await browser.newPage();
                try {
                    page.on('console', msg => {
                        for (let i = 0; i < msg.args().length; ++i) {
                            console.log('loadbalancer:', `${i}: ${msg.args()[i]}`);
                        }
                    });

                    page.on("pageerror", msg => {
                        console.log("MCU PAGE ERROR: ", msg);
                    });

                    page.on('error', msg => {
                        console.log("MCU ERROR: ", msg);
                        throw msg;
                    });

                    await page.goto(masterURL + '/ezMCU/mcuLb.html');
                    await page.waitFor('#loadMCUBtn');
                    await page.click('body');

                    await page.evaluate((config) => { setMCUConfig(config); }, mcuConfig);
                    await page.click('#loadMCUBtn');
                    setTimeout(function () { //Wait 10sec to spin it up and ensure no error
                        mcuStartedWithoutError = true;
                    }, 1000 * 10)
                } catch (e) {
                    console.log("MCU ERROR: ", e);
                    if (mcuStartedWithoutError) { //Startup the mcu if it crashes while running (should not happen, just in case)
                        console.log("Restart MCU!")
                        startUpMcu();
                    }
                    mcuStartedWithoutError = false;
                }
            }
            startUpMcu();
        } else {
            if (mcuConfig.isMaster) {
                console.log("\n\nWARNING: LOCAL MCU NOT STARTED! BE SURE TO SET UP A LOADBALANCER!\n\n");
            } else {
                console.log("\n\nERROR: YOU CAN NOT SET 'isMaster' TO FALSE AND DISABLE 'enableLocalMCU'! LOADBALANCER NEEDS 'enableLocalMCU' ENABLED (set to 'true')! \n\n");
            }
        }
    } else {
        console.log("COULD NOT START MCU! NO BROWSER WAS GIVEN!")
    }
}

function getTURNCredentials(name, secret) {
    var unixTimeStamp = parseInt((+new Date() / 1000) + "") + 48 * 3600,   // this credential would be valid for the next 48 hours
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

module.exports = {
    init: init
}