var wrtc = window;
//@ts-check
function initEzWebRTC(initiator, config) {
    var _this = this;
    this.isConnected = false;
    this.gotOffer = false;
    this.makingOffer = false;

    var rtcConfig = { //Default Values
        offerOptions: {
            offerToReceiveAudio: true, //- depricated - want audio
            offerToReceiveVideo: true  //- depricated - want video
        },
        stream: null,
        'iceServers': [
            {
                "urls": "stun:stun.l.google.com:19302"
            }
        ],
        sdpSemantics: 'unified-plan',
        iceConnectionTimeoutInSec: 30,
        preferH264Codec: false
    }
    if (config) {
        for (var i in config) {
            rtcConfig[i] = config[i];
        }
    }

    //Make new peer
    var pc = new wrtc.RTCPeerConnection(rtcConfig);

    pc.onsignalingstatechange = function (event) {
        _this.emitEvent("onsignalingstatechange", event);
    }

    pc.onicecandidate = function (e) {
        if (!pc || !e || !e.candidate) return;
        _this.emitEvent("signaling", e.candidate)
    };

    var knownStreams = {};
    pc.ontrack = function (event) {
        event.streams.forEach(eventStream => {
            _this.emitEvent('track', event.track, eventStream);
            if (!knownStreams[eventStream.id]) { //emit onStream event
                _this.emitEvent("stream", eventStream);
                eventStream.onremovetrack = (event) => {
                    _this.emitEvent('trackremoved', event.track, eventStream);
                    let tracks = eventStream.getTracks();
                    if (tracks.length == 0) { //If no tracks left
                        _this.emitEvent("streamremoved", eventStream, event.track.kind);
                    }
                    delete trackSenders[event.track.id]
                };
            }
            knownStreams[eventStream.id] = true;
        });
    }

    var iceConnectionTimeout;
    pc.oniceconnectionstatechange = async function (e) {
        //console.log('ICE state: ' + pc.iceConnectionState);
        if (pc.iceConnectionState == "connected" || pc.iceConnectionState == "completed") {
            if (iceConnectionTimeout) { clearTimeout(iceConnectionTimeout); };
            if (!_this.isConnected) {
                _this.isConnected = true;
                _this.emitEvent("connect", true)
            }
        } else if (pc.iceConnectionState == 'disconnected') {
            setTimeout(async function () { //lets wait if connection switches back to connected in a few seconds
                if (_this.isConnected && pc.iceConnectionState == "disconnected" && initiator) {  //if still in disconnected and not closed state try to restart ice
                    //console.log("Try to recover ice connection form disconnected state!")
                    await pc.setLocalDescription(await pc.createOffer({ iceRestart: true }));
                    _this.emitEvent("signaling", pc.localDescription);
                }
            }, 3000);
            iceConnectionTimeout = setTimeout(function () { //Close the connection if state not changes to connected in a given time
                if (_this.isConnected) {
                    _this.isConnected = false;
                    _this.emitEvent("closed", true)
                }
            }, rtcConfig.iceConnectionTimeoutInSec * 1000);
        } else if (pc.iceConnectionState == 'closed') {
            if (_this.isConnected) {
                _this.isConnected = false;
                _this.emitEvent("closed", true)
            }
        } else if (pc.iceConnectionState == 'failed' && initiator) { //Try to reconnect from initator side
            //console.log("Try to recover ice connection form failed state!")
            await pc.setLocalDescription(await pc.createOffer({ iceRestart: true }))
            _this.emitEvent("signaling", pc.localDescription)
            _this.emitEvent("iceFailed", true)
        }
    };

    pc.onnegotiationneeded = function () {
        negotiate();
    }

    this.signaling = async function (signalData) { //Handle signaling
        if (signalData == "renegotiate" && initiator) { //Got renegotiate request, so do it
            negotiate();
        } else if (signalData && signalData.type == "offer") { //Got an offer -> Create Answer)
            _this.gotOffer = true;
            if (pc.signalingState != "stable") { //If not stable ask for renegotiation
                await Promise.all([
                    pc.setLocalDescription({ type: "rollback" }), //Be polite
                    await pc.setRemoteDescription(new wrtc.RTCSessionDescription(signalData))
                ]);
            } else {
                await pc.setRemoteDescription(new wrtc.RTCSessionDescription(signalData))
            }
            await pc.setLocalDescription(await pc.createAnswer(rtcConfig.offerOptions));
            var a_desc = pc.localDescription;
            a_desc.sdp = rtcConfig.preferH264Codec ? preferH264Codec(a_desc.sdp) : a_desc.sdp;
            a_desc.sdp = removeDoubleSSRC(a_desc.sdp);
            _this.emitEvent("signaling", a_desc)
            if (!initiator)
                requestMissingTransceivers()
        } else if (signalData && signalData.type == "answer" && initiator) { //Initiator: Setting answer and starting connection
            _this.makingOffer = false;
            pc.setRemoteDescription(new wrtc.RTCSessionDescription(signalData))
        } else if (signalData && signalData.type == "transceive" && initiator) { //Got an request to transrecive
            _this.addTransceiver(signalData.kind, signalData.init)
        } else if (signalData && signalData.candidate) { //is a icecandidate thing
            pc.addIceCandidate(new wrtc.RTCIceCandidate(signalData));
        } else {
            console.log("Some unused signaling data???", signalData)
        }
    }

    var trackSenders = {};
    this.addStream = function (stream) {
        stream.getTracks().forEach(track => {
            trackSenders[track.id] = pc.addTrack(track, stream); //Add all tracks to pc
        })
    }

    this.removeStream = function (stream) {
        stream.getTracks().forEach(track => {
            pc.removeTrack(trackSenders[track.id])
        });
    }

    this.addTrack = function (track, stream) {
        pc.addTrack(track, stream);
    }

    this.removeTrack = function (track) {
        pc.removeTrack(trackSenders[track.id])
    }

    this.addTransceiver = function (kind, init) {
        if (initiator) {
            try {
                pc.addTransceiver(kind, init)
            } catch (err) {
                console.log("addTransceiver Error", err)
                _this.destroy()
            }
        } else {
            _this.emitEvent("signaling", { // request initiator add a transceiver
                type: "transceive",
                kind: kind,
                init: init
            })
        }
    }

    this.destroy = function () {
        pc.close();
        pc.oniceconnectionstatechange = null
        pc.onicegatheringstatechange = null
        pc.onsignalingstatechange = null
        pc.onicecandidate = null
        pc.ontrack = null
        _this.isConnected = false;
    }

    if (rtcConfig.stream) {
        this.addStream(rtcConfig.stream); //Add stream at start, this will trigger negotiation
    } else if (initiator) { //start negotiation if we are initiator anyway if we have no stream
        negotiate();
    }

    async function negotiate() {
        if (_this.makingOffer) //Dont make an offer twice before answer is received
            return;
        //console.log("negotiate", initiator)
        if (initiator) {
            _this.makingOffer = true;
            const offer = await pc.createOffer(rtcConfig.offerOptions); //Create offer
            if (pc.signalingState != "stable") return;
            await pc.setLocalDescription(offer);
            var o_desc = pc.localDescription;
            o_desc.sdp = rtcConfig.preferH264Codec ? preferH264Codec(o_desc.sdp) : o_desc.sdp;
            _this.emitEvent("signaling", o_desc)
        } else if (_this.gotOffer) { //Dont send renegotiate req before getting at least one offer
            _this.emitEvent("signaling", "renegotiate");
        }
    }

    function requestMissingTransceivers() {
        if (pc.getTransceivers) {
            try {
                pc.getTransceivers().forEach(transceiver => {
                    if (!transceiver.mid && transceiver.sender.track && !transceiver.requested) {
                        transceiver.requested = true // HACK: Safari returns negotiated transceivers with a null mid
                        _this.addTransceiver(transceiver.sender.track.kind)
                    }
                })
            } catch (e) {
                console.log("Faild to add transriver!", e)
            }
        }
    }

    this.mappedEvents = {};
    this.on = function (eventname, callback) {
        if (_this.mappedEvents[eventname]) {
            _this.mappedEvents[eventname].push(callback)
        } else {
            _this.mappedEvents[eventname] = [callback];
        }
    };

    this.emitEvent = function (eventname) {
        for (var i in this.mappedEvents[eventname]) {
            _this.mappedEvents[eventname][i](arguments[1], arguments[2], arguments[3])
        }
    };
    return this;
}

function preferH264Codec(sdp) {
    var lineSplit = sdp.split("\n")
    console.log(lineSplit)
    var videoLinesIndexs = [];
    var h264ids = [];
    for (var i in lineSplit) {
        if (lineSplit[i].startsWith("m=video")) { //find the video line
            videoLinesIndexs.push(i);
        } else if (lineSplit[i].startsWith("a=rtpmap")) { //find all codec lines
            if (lineSplit[i].indexOf("H264") !== -1) {
                h264ids.push(lineSplit[i].split("rtpmap:")[1].split(" ")[0])
            }
        }
    }

    for(var k in videoLinesIndexs) {
        var videoLineIndex = videoLinesIndexs[k];
        for (var i = h264ids.length; i--; i >= 0) { //Change codec order
            var h264id = h264ids[i];
            lineSplit[videoLineIndex] = lineSplit[videoLineIndex].replace(" " + h264id, "")
            lineSplit[videoLineIndex] = lineSplit[videoLineIndex].replace("SAVPF ", "SAVPF " + h264id + " ")
        }
    }
    return lineSplit.join("\n");
}

function removeDoubleSSRC(sdp) {
    var lineSplit = sdp.split("\n");
    var mediaWithSSRC = null;
    var mediaCnt = 0;
    var readyToRemove = false;
    var res = [];
    for (var i in lineSplit) {
        if (lineSplit[i].startsWith("m=")) { //find the video line
            mediaCnt++;
        }
        if (lineSplit[i].startsWith("a=ssrc")) { //find the video line
            if(!mediaWithSSRC) {
                mediaWithSSRC = mediaCnt;
            }
            if(mediaWithSSRC < mediaCnt) {
                readyToRemove = true;
            }
        }
        if(readyToRemove && lineSplit[i].startsWith("a=ssrc")) {
            //Do nothing
        } else {
            res.push(lineSplit[i]);
        }
    }
    return res.join("\n");
}