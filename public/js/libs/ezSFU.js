//@ts-check
function ezSFU(socket, newConfig = {}) {
    var _this = this;
    var sfuConfig = {}
    for (var i in newConfig) {
        sfuConfig[i] = newConfig[i];
    }
    this.socket = socket;
    this.mappedEvents = {};
    this.peers = {}; //contains all peers (to main and load balancers)
    this.allStreamAttributes = {};
    this.currentIceServers = [];

    this.on = function (eventname, callback) {
        if (this.mappedEvents[eventname]) {
            this.mappedEvents[eventname].push(callback)
        } else {
            this.mappedEvents[eventname] = [callback];
        }
    };
    this.emitEvent = function (eventname) {
        for (var i in this.mappedEvents[eventname]) {
            this.mappedEvents[eventname][i](arguments[1], arguments[2], arguments[3])
        }
    };
    this.makeNewPeer = function (peerId, connectedCallback, iceServers, stream) {
        var _this = this;
        if (_this.peers[peerId]) {
            return console.log("Already connected to this peer!");
        }

        _this.peers[peerId] = new initEzWebRTC(false, { iceServers: iceServers, stream : stream })
        _this.peers[peerId].on('error', err => console.log('error', err))

        _this.peers[peerId].on('signaling', data => {
            //console.log("SENDING SIGNALING OUT >", data)
            socket.emit("sfu_signaling", { instanceTo: peerId, data: data })
        })

        _this.peers[peerId].on('stream', stream => {
            stream.audioMuted = false;
            var streamId = stream.id.replace("{", "").replace("}", "");
            stream["streamAttributes"] = _this.allStreamAttributes[streamId];
            console.log("New Stream on peer:", streamId)
            stream.hasVideo = (stream.getVideoTracks().length > 0);
            stream.hasAudio = (stream.getAudioTracks().length > 0);

            _this.emitEvent("streamAdded", stream);
        })

        _this.peers[peerId].on('connect', () => {
            console.log('CONNECTED PEER');
            if (connectedCallback)
                connectedCallback();
        })

        _this.peers[peerId].on('disconnect', () => {
            _this.peers[peerId].destroy();
            delete _this.peers[peerId];
            _this.emitEvent("peerDisconnected", peerId);
        })
    };
    this.init = function () {
        var _this = this;
        socket.on("connect", function () {
            console.log("sfu socket connected");

            socket.on("sfu_signaling", function (content) {

                var data = content["data"];
                //console.log("SENDING SIGNALING IN <", data)
                var instanceFrom = content["instanceFrom"];
                if (_this.peers[instanceFrom]) {
                    _this.peers[instanceFrom].signaling(data);
                } else {
                    console.log("Error: Can not send signal to disconnected peer!", content)
                }
            })

            socket.on("sfu_onUserJoinedRoom", function (content) {
                _this.emitEvent("userJoinedRoom", content);
            })

            socket.on("sfu_onUserDisconnectedFromRoom", function (socketId) {
                _this.emitEvent("userDisconnectedFromRoom", socketId);
            })

            socket.on("sfu_onStreamUnpublished", function (streamAttributes) {
                _this.emitEvent("streamUnpublished", streamAttributes);
            })

            socket.on("sfu_recordingStarted", function (streamId) {
                _this.emitEvent("recordingStarted", streamId);
            })

            socket.on("sfu_recordingDone", function (content) {
                var streamId = content.streamId;
                var filename = content.filename;
                _this.emitEvent("recordingDone", streamId, filename);
            })

            socket.on("sfu_onIceServers", function (iceServers) {
                _this.currentIceServers = iceServers;
            })

            socket.on("sfu_onNewStreamPublished", function (content) {
                console.log("sfu_onNewStreamPublished", content)
                // var username = content["username"];
                // var socketId = content["socketId"];
                // var roomname = content["roomname"];
                // var attributes = content["attributes"];
                // var instanceTo = content["instanceTo"];
                var streamId = content["streamId"];
                _this.allStreamAttributes[streamId] = content;
                _this.emitEvent("newStreamPublished", content);
            })

            socket.on('error', (error) => {
                console.log(error);
            });

            socket.on('connect_error', (error) => {
                console.log(error);
            });

            socket.on('connect_timeout', (timeout) => {
                console.log(timeout);
            });
        });
    };
    this.joinRoom = function (username, roomname, callback) {
        socket.emit("sfu_joinRoom", {
            roomname: roomname,
            username: username
        }, function (iceServers) {
            console.log("iceServers", iceServers)
            _this.currentIceServers = iceServers;
            console.log("JOINED!");
            callback();
        });
    };
    this.unpublishStream = function (stream) {
        socket.emit("sfu_unpublishStream", stream.id.replace("{", "").replace("}", ""), function (err) {
            if (err) console.log(err);
        });
        for (var i in stream.getAudioTracks()) {
            stream.getAudioTracks()[i].stop();
        }
        for (var i in stream.getVideoTracks()) {
            stream.getVideoTracks()[i].stop();
        }
    };
    this.muteMediaStream = function (mute, stream) {
        for (var i in stream.getAudioTracks()) {
            stream.getAudioTracks()[i].enabled = !mute;
        }
        stream.audioMuted = mute;
    };
    this.showMediaStream = function (elmDomId, stream, css = "") {
        var streamId = stream.id.replace("{", "").replace("}", "")
        var mediaEl = null;

        mediaEl = stream.hasVideo ? document.createElement('video') : document.createElement('audio');

        mediaEl.setAttribute("style", css);
        mediaEl.setAttribute("autoplay", "autoplay");
        mediaEl.id = streamId;
        document.getElementById(elmDomId).appendChild(mediaEl);

        mediaEl.srcObject = stream;
        mediaEl.play();
    };
    this.getAllStreamsFromRoom = function (roomname, callback) {
        var _this = this;
        socket.emit("sfu_getAllStreamsFromRoom", roomname, function (content) {
            var activeStreamAttrs = {};
            for (var i in content) {
                if (content[i].active) {
                    activeStreamAttrs[content[i].streamId] = content[i];
                }
            }
            _this.allStreamAttributes = activeStreamAttrs;
            //Callback
            callback(activeStreamAttrs);
            console.log("all streams", activeStreamAttrs)
        })
    };
    this.subscribeToStream = function (streamId, callback) {
        var _this = this;
        var instanceTo = _this.allStreamAttributes[streamId] ? _this.allStreamAttributes[streamId]["instanceTo"] : "";
        if (_this.peers[instanceTo] && _this.peers[instanceTo].isConnected) {
            console.log("REQEST THE STREAM!!", streamId)
            socket.emit("sfu_reqStreamFromLB", {
                "instanceFrom": instanceTo,
                "streamId": streamId,
            }, callback);
        } else if (_this.peers[instanceTo]) { //We already started a connection so wait for it to connect
            setTimeout(function () {
                _this.subscribeToStream(streamId, callback);
            }, 100)
        } else {
            //We need to connect to the instance first
            _this.makeNewPeer(instanceTo, function () {
                //Connected callback
                console.log("LOADBALANCER CONNECTED (Without stream add)!!!");
            }, _this.currentIceServers);

            console.log("REQEST THE STREAM!!")
            socket.emit("sfu_reqStreamFromLB", {
                "instanceFrom": instanceTo,
                "streamId": streamId,
            }, callback);
        }
    };
    this.publishStreamToRoom = function (roomname, stream, callback) {
        var _this = this;

        var streamAttributes = {}
        for (var i in stream.streamAttributes) {
            streamAttributes[i] = stream.streamAttributes[i];
        }
        streamAttributes["roomname"] = roomname;
        streamAttributes["streamId"] = stream.id.replace("{", "").replace("}", "");
        socket.emit("sfu_registerStream", streamAttributes, function (err, setStreamAttributes) {
            console.log("setStreamAttributes", setStreamAttributes)
            if (err) {
                callback(err)
                console.error(err)
            } else {
                var instanceTo = setStreamAttributes["instanceTo"] || "";
                if (_this.peers[instanceTo] && _this.peers[instanceTo].isConnected) {
                    _this.peers[instanceTo].addStream(stream);
                    callback(null, setStreamAttributes)
                } else if (_this.peers[instanceTo]) { //Connection started so wait for it...
                    setTimeout(function () {
                        _this.peers[instanceTo].addStream(stream);
                        //_this.publishStreamToRoom(roomname, stream, callback)
                    }, 500)
                } else if (!_this.peers[instanceTo]) {
                    //We need to connect to the instance first
                    console.log("CONNECT TO LB!!!");
                    _this.makeNewPeer(instanceTo, function () {
                        //Connected callback
                        console.log("LOADBALANCER CONNECTED (With streamadd)!!!");
                        //_this.peers[instanceTo].addStream();
                        callback();
                    }, _this.currentIceServers, stream);

                    socket.emit("sfu_reqPeerConnectionToLB", {
                        "instanceTo": instanceTo
                    });
                } else {
                    console.log("Problem while connecting to the given streaming instance! Check logs.", setStreamAttributes)
                    callback("Problem while connecting to the given streaming instance! Check logs.")
                }
            }
        });

    };
    this.recordStream = function (streamId) {
        socket.emit("sfu_recordStream", streamId.replace("{", "").replace("}", ""));
    }
}