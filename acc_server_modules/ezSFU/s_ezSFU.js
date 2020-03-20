//@ts-check

/* -----------------------------
WebRTC SFU created with simple-peer and the Chromium WebRTC Stack!
So all things supported that are supported by Chromium
 --------------------------- */
var os = require('os-utils');
var crypto = require('crypto');
var ezWebRTC = require('./s_ezWebRTC');
var ezRtcRecorder = require("./s_ezRtcRecorder");
var allStreams = {}; //Contains all the streams on this instance
var allStreamAttributes = {}; //Constains all the stream Attr (also from streams on other instances)
var allRecorders = {}; //Contains all the recorders
var allPeers = {};
var loadBalancersSockets = {};
var loadBalancersAttributes = {
    "main": {
        enabled: true, //set to false and the main server does not handle any streams (An other loadbalancer has to be online)
        maxWantedCpuLoad: 40,  //New streams will only be accepted if no other instance is available over this load (Set to 0 to always use other instances if possible)
        maxCpuLoad: 80, //Limit CPU Load no new streams will be accepted on higher cpu load (clients can sub to streams regardless)
        minMemory: 200 //Only accept new streams on this amount of RAM (MB) or more
    }
};

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
            delete loadBalancersAttributes[socket.id];
            localPeer.destroy();
            delete allPeers[socket.id];
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

        var localPeer = new ezWebRTC.initEzWebRTC(false, newConfig.webRtcConfig) //Create a peer for every socketconnection
        allPeers[socket.id] = localPeer;

        localPeer.on('error', function (err) {
            console.log('peererror', socket.id, err)
        });

        localPeer.on('disconnect', () => {
        })

        localPeer.on('connect', () => {
        })

        localPeer.on('signaling', data => {
            //console.log("SIGNALING OUT >", data.type)
            socket.emit("sfu_signaling", { instanceFrom: "main", data: data });
        })

        localPeer.on('stream', stream => {
            var streamId = stream.id.replace("{", "").replace("}", "");
            allStreams[streamId] = stream;

            if (!allStreamAttributes[streamId]) {
                allStreamAttributes[streamId] = {};
            }

            allStreamAttributes[streamId]["socketId"] = socket.id;
            allStreamAttributes[streamId]["streamId"] = streamId;
            allStreamAttributes[streamId]["active"] = true;
            if (allStreamAttributes[streamId]["roomname"]) {
                socket.to(allStreamAttributes[streamId]["roomname"]).emit("sfu_onNewStreamPublished", allStreamAttributes[streamId]); //To hole room if stream is in
            }

            socket.emit("sfu_onNewStreamPublished", allStreamAttributes[streamId]) //to yourself
        });

        socket.on("sfu_joinRoom", function (content, callback) { //call to join a room
            var username = content["username"].trim() || "unknown" + (+(new Date()));
            var roomname = content["roomname"].trim() || "";
            myRooms[roomname] = roomname;

            if (roomname == "" || username == "") {
                return console.log("error, not entered room! roomname or username is empty!")
            }

            socket.join(roomname);
            socket.to(roomname).emit("sfu_onUserJoinedRoom", { socketId: socket.id, username: username })
            callback();
        });

        //Handel signaling between client and server peers
        socket.on("sfu_signaling", function (content) {
            var instanceTo = content["instanceTo"];
            var data = content["data"];
            if (instanceTo == "main") {
                try {
                    //console.log("SIGNALING IN <", data.type)
                    localPeer.signaling(data);
                } catch (e) {
                    console.log("warning: localPeer gone... no signaling!")
                }
            } else if (loadBalancersSockets[instanceTo]) {
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

        //client wants to sub to a stream
        socket.on("sfu_subscribeToStream", function (streamId, callback) {
            //console.log("subStream", content)
            function subToStream(subCnt) {
                if (allStreams[streamId]) {
                    // @ts-ignore
                    if (localPeer.isConnected) {
                        try {
                            localPeer.addStream(allStreams[streamId]);
                            callback(null);
                        } catch (e) {
                            console.log("warning: something wrong on addstream!", e)
                            callback("warning: localPeer could not addstream! " + streamId);
                        }
                    } else {
                        if (subCnt > 100) {
                            return callback("Error: something wrong with the connection to main peer! " + streamId);
                        }
                        setTimeout(function () {
                            subToStream(++subCnt)
                        }, 200); //Wait for connection to be ready
                    }
                } else {
                    callback("could not find stream! " + streamId);
                }
            }
            subToStream(0);
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
                    //allStreams[streamAttributes["streamId"]] = true;
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
                delete allRecorders[streamId];
                callback();
            } else {
                callback("Not a stream you own! Nothing was set!");
            }
        })

        socket.on("sfu_recordStream", function (streamId) {
            if (!newConfig.recordingEnabled) {
                return console.log("Recording is not enabled!")
            }
            var stream = allStreams[streamId];
            if (stream != null) {
                socket.emit("sfu_recordingStarted", streamId);
                if (!allRecorders[streamId]) {
                    var filename = (+new Date()) + '_' + streamId + '.mp4'
                    var rec = new ezRtcRecorder.record(stream, {
                        width: 640,
                        height: 480,
                        recordName: filename,
                        recordPath: newConfig.recordPath || './'
                    }, function () {
                        socket.emit("sfu_recordingDone", { streamId: streamId, filename: filename })
                        console.log("REC DONE!")
                    });
                    allRecorders[streamId] = rec;

                    // setTimeout(function () {
                    //     rec.stop();
                    // }, 10000)
                }
            }
        })

        socket.on("sfu_stopRecordStream", function (streamId) {
            if (allRecorders[streamId]) {
                allRecorders[streamId].stop();
            }
        });

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
                loadBalancersAttributes[socket.id] = attributes || {};
                console.log("New Loadbalancer connected: ", socket.id);
            }
        });

        socket.on("sfu_updateLoadBalancerAttributes", function (lbAuthKey, attributes) {
            if (newConfig["loadBalancerAuthKey"] && newConfig["loadBalancerAuthKey"] == lbAuthKey) {
                loadBalancersAttributes[socket.id] = attributes || {};
            }
        });

        socket.on("sfu_reqCurrentIceServers", function (lbAuthKey) {
            if (newConfig["loadBalancerAuthKey"] && newConfig["loadBalancerAuthKey"] == lbAuthKey) {
                socket.emit("sfu_onIceServers", getCurrentIceServers())
            }
        })

        socket.on("sfu_streamIsActive", function (lbAuthKey, streamId) {
            if (newConfig["loadBalancerAuthKey"] && newConfig["loadBalancerAuthKey"] == lbAuthKey) {
                if (allStreamAttributes[streamId]) {
                    allStreamAttributes[streamId]["active"] = true;
                    if (allStreamAttributes[streamId]["roomname"]) {
                        socket.to(allStreamAttributes[streamId]["roomname"]).emit("sfu_onNewStreamPublished", allStreamAttributes[streamId]); //To hole room if stream is in
                    }

                    socket.emit("sfu_onNewStreamPublished", allStreamAttributes[streamId]) //to yourself
                }
            }
        })

        //END - LOAD BALANCER STUFF
    })

    function findBestStreamingInstance(streamAttributes, callback) {
        var instanceId = null;
        for (var i in loadBalancersAttributes) { //Find a fitting free loadbalancer
            if (loadBalancersAttributes[i]["enabled"] && loadBalancersAttributes[i]["cpuUsage"] < loadBalancersAttributes[i]["maxCpuLoad"]) { // && loadBalancersAttributes[i]["freeMem"] > loadBalancersAttributes[i]["minMemory"]
                if (!instanceId) { //If we have no instance, set always one
                    instanceId = i;
                } else if ((loadBalancersAttributes[i]["maxWantedCpuLoad"] - loadBalancersAttributes[i]["cpuUsage"]) > (loadBalancersAttributes[instanceId]["maxWantedCpuLoad"] - loadBalancersAttributes[instanceId]["cpuUsage"])) { //Take the instance with less load away from wanted cpuLoad 
                    instanceId = i;
                }
            }
        }
        console.log("mainload", loadBalancersAttributes["main"]["enabled"], loadBalancersAttributes["main"]["cpuUsage"], loadBalancersAttributes["main"]["maxCpuLoad"], loadBalancersAttributes["main"]["freeMem"], loadBalancersAttributes["main"]["minMemory"])
        if (!instanceId) {
            callback(null, "main");
            // callback("No fitting streaming instance found! Maybe servers are down or to high server load?!", instanceId);
        } else {
            callback(null, instanceId);
        }
    }

    setInterval(function () {
        if (loadBalancersAttributes["main"]["enabled"]) {
            os.cpuUsage(function (cpuP) {
                loadBalancersAttributes["main"]["cpuUsage"] = cpuP;
                loadBalancersAttributes["main"]["freeMem"] = os.freemem();
            });
        }
    }, 1000)
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

module.exports = {
    init: init
}