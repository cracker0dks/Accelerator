//@ts-check
function ezMCU(socket, newConfig = {}) {
    var _this = this;
    this.mcuConfig = {}
    for (var i in newConfig) {
        this.mcuConfig[i] = newConfig[i];
    }
    this.socket = socket;
    this.mappedEvents = {};
    this.peers = {}; //contains all peers (to main and load balancers)
    this.allStreamAttributes = {};
    var allEncodeWorkers = {};
    var allEncodeTimeouts = {};
    const workerSrc = './js/webm-wasm/vpx-worker.js';

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
    this.makeNewPeer = function (peerId, connectedCallback, stream) {
        var _this = this;
        _this.mcuConfig["stream"] = stream;
        var _this = this;
        if (_this.peers[peerId]) {
            return console.log("Already connected to this peer!");
        }
        _this.peers[peerId] = new initEzWebRTC(false, _this.mcuConfig)
        _this.peers[peerId].on('error', function (err) { _this.emitEvent("error", err); })

        _this.peers[peerId].on('signaling', data => {
            //console.log("SENDING SIGNALING OUT >", data)
            socket.emit("mcu_signaling", { instanceTo: peerId, data: data })
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

        _this.peers[peerId].on('closed', () => {
            _this.peers[peerId].destroy();
            delete _this.peers[peerId];
            _this.emitEvent("peerDisconnected", peerId);
        })

        _this.peers[peerId].on('iceFailed', () => {
            _this.emitEvent("iceFailed", peerId);
        });
    };
    this.init = function () {
        socket.on("connect", function () {
            console.log("mcu socket connected");

            socket.on("mcu_signaling", function (content) {

                var data = content["data"];
                //console.log("SENDING SIGNALING IN <", data)
                var instanceFrom = content["instanceFrom"];
                if (_this.peers[instanceFrom]) {
                    _this.peers[instanceFrom].signaling(data);
                } else {
                    console.log("Error: Can not send signal to disconnected peer!", content)
                }
            })

            socket.on("mcu_onUserJoinedRoom", function (content) {
                _this.emitEvent("userJoinedRoom", content);
            })

            socket.on("mcu_onUserDisconnectedFromRoom", function (socketId) {
                _this.emitEvent("userDisconnectedFromRoom", socketId);
            })

            socket.on("mcu_onStreamUnpublished", function (streamAttributes) {
                _this.emitEvent("streamUnpublished", streamAttributes);
            })

            socket.on("mcu_recordingStarted", function (streamId) {
                _this.emitEvent("recordingStarted", streamId);
            })

            socket.on("mcu_recordingDone", function (content) {
                var streamId = content.streamId;
                var filename = content.filename;
                _this.emitEvent("recordingDone", streamId, filename);
            })

            socket.on("mcu_onIceServers", function (iceServers) {
                _this.mcuConfig["iceServers"] = iceServers;
            })

            var knownStreams = {};
            var workerBuffer = [new Worker(workerSrc)]

            socket.on("mcu_vid", function (content) {
                var streamId = content["streamId"];
                //console.log(content["d"])
                var d = content["d"];

                if (!knownStreams[streamId]) {
                    console.log("CREATE STREAM!");
                    knownStreams[streamId] = true;
                    var steamAttr = _this.allStreamAttributes[streamId];
                    steamAttr["canvasStream"] = true;
                    console.log(steamAttr);


                    const vpxdec_ = workerBuffer[workerBuffer.length - 1];
                    workerBuffer.push(new Worker(workerSrc))
                    const vpxconfig_ = {};

                    const width = steamAttr.videoWidth;
                    const height = steamAttr.videoHeight;

                    var canvasEl = $('<canvas class="' + streamId + '"></canvas>');
                    $("#mediaC").append(canvasEl);
                    //canvasEl.appendTo("body")
                    var remoteCanvas = canvasEl[0]
                    var remoteContext = remoteCanvas.getContext('2d');

                    remoteCanvas.width = width;
                    remoteCanvas.height = height;

                    vpxconfig_.codec = "VP8";
                    vpxconfig_.width = width;
                    vpxconfig_.height = height;
                    vpxconfig_.fps = _this.mcuConfig.processingFPS;
                    vpxconfig_.bitrate = _this.mcuConfig.processingBitrate;
                    vpxconfig_.packetSize = 16;

                    vpxdec_.postMessage({ type: 'init', data: vpxconfig_ });

                    vpxdec_.onmessage = e => {
                        if (e.data.res) {
                            const decoded = new Uint8Array(e.data.res);
                            const frame = remoteContext.createImageData(width, height);
                            frame.data.set(decoded, 0);
                            remoteContext.putImageData(frame, 0, 0);
                        }
                    };
                    allEncodeWorkers[streamId] = vpxdec_;

                    canvasEl.streamAttributes = steamAttr;

                    remoteContext.fillStyle = "#FFFFFF";
                    remoteContext.fillRect(0, 0, width, height);
                    remoteContext.font = "25px Arial";
                    remoteContext.fillStyle = "#000000";
                    remoteContext.fillText("Connecting Videostream...", 30, 50);
                    _this.emitEvent("streamAdded", canvasEl);
                }

                allEncodeWorkers[streamId].postMessage({
                    id: 'dec',
                    type: 'call',
                    name: 'decode',
                    args: [d],
                }, [d]);

            })

            socket.on("mcu_onNewStreamPublished", function (content) {
                console.log("mcu_onNewStreamPublished", content)
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
        socket.emit("mcu_joinRoom", {
            roomname: roomname,
            username: username
        }, function (mcuConfig) {
            console.log("mcuConfig", mcuConfig)
            _this.mcuConfig = mcuConfig;
            console.log("JOINED!");
            callback();
        });
    };
    this.unpublishStream = function (stream) {
        var streamId = stream.id.replace("{", "").replace("}", "");
        socket.emit("mcu_unpublishStream", streamId, function (err) {
            if (err) console.log(err);
        });
        for (var i in stream.getAudioTracks()) {
            stream.getAudioTracks()[i].stop();
        }
        for (var i in stream.getVideoTracks()) {
            stream.getVideoTracks()[i].stop();
        }
        if (allEncodeTimeouts[streamId]) {
            clearInterval(allEncodeTimeouts[streamId])
            allEncodeTimeouts[streamId] = null;
        }
        if (allEncodeWorkers[streamId]) {
            allEncodeWorkers[streamId].terminate();
            allEncodeWorkers[streamId] = null;
        }
    };
    this.muteMediaStream = function (mute, stream) {
        for (var i in stream.getAudioTracks()) {
            stream.getAudioTracks()[i].enabled = !mute;
        }
        stream.audioMuted = mute;
    };
    this.showMediaStream = function (elmDomId, stream, css = "") {
        var streamAttr = stream.streamAttributes;
        var streamId = stream.id ? stream.id.replace("{", "").replace("}", "") : streamAttr["streamId"];

        if (streamAttr && streamAttr.canvasStream) {
            stream[0].setAttribute("style", css);
            stream[0].id = streamId;
            document.getElementById(elmDomId).appendChild(stream[0]);
        } else { //Video or audio stream via peer
            var mediaEl = null;
            var videoTracks = stream.getVideoTracks();
            var hasVideo = videoTracks.length > 0 ? true : false;
            mediaEl = hasVideo ? document.createElement('video') : document.createElement('audio');

            mediaEl.setAttribute("style", css);
            mediaEl.setAttribute("autoplay", "autoplay");
            mediaEl.id = streamId;
            document.getElementById(elmDomId).appendChild(mediaEl);

            mediaEl.srcObject = stream;
            mediaEl.play();
        }

    };
    this.getAllStreamsFromRoom = function (roomname, callback) {
        var _this = this;
        socket.emit("mcu_getAllStreamsFromRoom", roomname, function (content) {
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
        console.log("_this.allStreamAttributes", _this.allStreamAttributes[streamId])

        //if this is a clientProccesedStream we dont need to connect to LBs
        if (_this.allStreamAttributes && _this.allStreamAttributes[streamId] && _this.allStreamAttributes[streamId]["clientProcessedStream"] && _this.allStreamAttributes[streamId]["hasVideo"]) {
            socket.emit("mcu_reqStreamFromLB", {
                "instanceFrom": instanceTo,
                "streamId": streamId,
            }, callback);
            return;
        }

        if (_this.peers[instanceTo] && _this.peers[instanceTo].isConnected) {
            console.log("REQEST THE STREAM!!", streamId)
            socket.emit("mcu_reqStreamFromLB", {
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
            });

            console.log("REQEST THE STREAM!!")
            socket.emit("mcu_reqStreamFromLB", {
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
        var videoTracks = stream.getVideoTracks();
        var streamId = stream.id.replace("{", "").replace("}", "");
        streamAttributes["roomname"] = roomname;
        streamAttributes["streamId"] = streamId
        //streamAttributes["instanceTo"] = accSettings["enableClientVideoProcessing"] ? "main" : null;
        streamAttributes["hasVideo"] = videoTracks.length > 0 ? true : false;

        if (accSettings["enableClientVideoProcessing"] && videoTracks.length > 0) {
            callback(null, streamAttributes); //callback so we add video to dom
            var localVideo = $("#" + streamId)[0];
            localVideo.addEventListener("canplay", function () {
                const width = localVideo.videoWidth;
                const height = localVideo.videoHeight;
                streamAttributes["videoWidth"] = width;
                streamAttributes["videoHeight"] = height;
                streamAttributes["clientProcessedStream"] = accSettings["enableClientVideoProcessing"] ? "true" : null;
                streamAttributes["active"] = true;

                socket.emit("mcu_registerStream", streamAttributes, function (err, setStreamAttributes) {
                    console.log("setStreamAttributes", setStreamAttributes, stream)
                    if (err) {
                        callback(err)
                        console.error(err)
                    } else {
                        var canvasEl = $('<canvas class="' + streamId + '"></canvas>');
                        var localCanvas = canvasEl[0]
                        var localContext = localCanvas.getContext('2d');

                        const vpxenc_ = new Worker(workerSrc);
                        allEncodeWorkers[streamId] = vpxenc_;

                        const vpxconfig_ = {};

                        vpxconfig_.codec = "VP8";
                        vpxconfig_.width = width;
                        vpxconfig_.height = height;
                        vpxconfig_.fps = _this.mcuConfig.processingFPS;
                        vpxconfig_.bitrate = _this.mcuConfig.processingBitrate;
                        vpxconfig_.packetSize = 16;

                        vpxenc_.postMessage({ type: 'init', data: vpxconfig_ });

                        let encoding = false;
                        setTimeout(() => {
                            localCanvas.width = width;
                            localCanvas.height = height;

                            allEncodeTimeouts[streamId] = setInterval(() => {
                                if (encoding) return;
                                encoding = true;
                                localContext.drawImage(localVideo, 0, 0, width, height);
                                const frame = localContext.getImageData(0, 0, width, height);
                                vpxenc_.postMessage({
                                    id: 'enc',
                                    type: 'call',
                                    name: 'encode',
                                    args: [frame.data.buffer]
                                }, [frame.data.buffer]);

                            }, 1000.0 / _this.mcuConfig.processingFPS);
                        }, 1000); // wait a bit before grabbing frames to give the wasm stuff time to init.

                        vpxenc_.onmessage = e => {
                            encoding = false;
                            if (e.data.res) {
                                socket.emit("client_vid", { streamId: streamId, d: e.data.res });
                            }
                        };

                    }
                });
            });
        } else {
            socket.emit("mcu_registerStream", streamAttributes, function (err, setStreamAttributes) {
                console.log("setStreamAttributes", setStreamAttributes, stream)
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
                        console.log("CONNECT TO LB!!!", instanceTo);
                        _this.makeNewPeer(instanceTo, function () {
                            //Connected callback
                            console.log("LOADBALANCER CONNECTED (With streamadd)!!!");
                            //_this.peers[instanceTo].addStream();
                            callback();
                        }, stream);

                        socket.emit("mcu_reqPeerConnectionToLB", {
                            "instanceTo": instanceTo
                        });
                    } else {
                        console.log("Problem while connecting to the given streaming instance! Check logs.", setStreamAttributes)
                        callback("Problem while connecting to the given streaming instance! Check logs.")
                    }
                }

            });
        }
    };
    this.recordStream = function (streamId) {
        socket.emit("mcu_recordStream", streamId.replace("{", "").replace("}", ""));
    }
}