$(document).ready(function () {
	$("#loadMCUBtn").click(function () {
		start()
	})
})

var mcuConfig = {
	enabled: true,
	loadBalancerAuthKey: "abc", //Auth key to connect to the master as loadBalancer
	masterURLAndPort: "http://127.0.0.1:8080", //IP Or hostname and port
	secure: false,
	webRtcConfig: {},
	processingFPS : 15
}

function setMCUConfig(config) {
	for (var i in config) {
		mcuConfig[i] = config[i];
	}
}

function start() {
	var socket = io(mcuConfig.masterURLAndPort, { secure: mcuConfig.secure, reconnect: true, rejectUnauthorized: false });

	var ac = new AudioContext();

	var allPeers = {};
	var allStreams = {};
	var allStreamDestinations = {};
	var allStreamSources = {};
	var streamRecordSubs = {};
	var allMediaRecorders = {};

	socket.on('connect', function () {
		socket.emit("mcu_reqCurrentIceServers", mcuConfig.loadBalancerAuthKey);

		socket.on('disconnect', function () {
			console.log("DISCONNECTED from Master Server!")
			for (var i in allPeers) {
				allPeers[i].destroy();
			}
			allPeers = {};
			allStreams = {};
			allStreamDestinations = {};
			allStreamSources = {};
		});

		socket.on('mcu_onIceServers', function (newIceServers) {
			mcuConfig.webRtcConfig.iceServers = newIceServers;
		});

		socket.on('mcu_onStreamUnpublished', function (streamAttr) {
			var streamId = streamAttr["streamId"];
			if (allStreams[streamId]) {
				delete allStreams[streamId];
			}
			console.log("stopped stream");
			allMediaRecorders[streamId].stop();
		});

		socket.on('mcu_reqSteam', function (content) {
			//console.log("mcu_reqSteam", content)
			var streamId = content.streamId;
			var clientSocketId = content.clientSocketId;
			if (allStreams[streamId]) {
				if (!allPeers[clientSocketId]) {
					createNewPeer(clientSocketId, function () {
						//console.log("Created peer!", clientSocketId, allStreams[streamId])
						pipeStream()
					});
				} else {
					pipeStream()
				}
			} else {
				console.log("StreamID not found!");
			}

			function pipeStream() {
				var audioTracks = allStreams[streamId].getAudioTracks();
				var videoTracks = allStreams[streamId].getVideoTracks();
				if (videoTracks.length > 0) {
					if (!streamRecordSubs[streamId]) { streamRecordSubs[streamId] = {} };
					streamRecordSubs[streamId][clientSocketId] = true;
					//allPeers[clientSocketId].addStream(allStreams[streamId]); //Old way with extra stream
				} else if (audioTracks.length > 0) {
					if (allStreamSources[streamId] && allStreamDestinations[clientSocketId]) {
						allStreamSources[streamId].connect(allStreamDestinations[clientSocketId])
					} else {
						console.log("missing src or dest to connect audio!")
					}
				} else {
					console.log("no stream, say what ?!!")
				}
			}
		});

		socket.on('mcu_reqPeerConnectionToLB', function (content) {
			//console.log("mcu_reqPeerConnectionToLB", content)
			var clientSocketId = content.clientSocketId;

			if (!allPeers[clientSocketId]) {
				createNewPeer(clientSocketId, function () {
					//console.log("Created peer!", clientSocketId)
				});
			}
		});

		socket.emit("mcu_registerLoadBalancer", mcuConfig.loadBalancerAuthKey, mcuConfig);

		socket.on('mcu_signaling', function (content) {
			var data = content["data"];
			var clientSocketId = content["clientSocketId"];
			if (allPeers[clientSocketId])
				allPeers[clientSocketId].signaling(data);
		});

		function createNewPeer(clientSocketId, callback) {
			var peerAudioStreamSrcs = [];
			var dest = ac.createMediaStreamDestination();
			allStreamDestinations[clientSocketId] = dest;

			mcuConfig.webRtcConfig["stream"] = dest.stream;
			var localPeer = new initEzWebRTC(true, mcuConfig.webRtcConfig)
			allPeers[clientSocketId] = localPeer;

			localPeer.on('error', function (err) {
				console.log('peererror', clientSocketId, err)
			});

			localPeer.on('closed', () => {
				for (var i in peerAudioStreamSrcs) {
					if (allStreamSources[i]) {
						allStreamSources[i].disconnect();
						delete allStreamSources[i];
					}
				}
				allPeers[clientSocketId].destroy();
				delete allPeers[clientSocketId];
				if (allStreamDestinations[clientSocketId]) {
					allStreamDestinations[clientSocketId].disconnect();
					delete allStreamDestinations[clientSocketId];
				}
				for (var i in streamRecordSubs) {
					if (streamRecordSubs[i][clientSocketId]) {
						delete streamRecordSubs[i][clientSocketId];
					}
				}
			})

			localPeer.on('connect', () => {
				callback();
				//console.log("CONNECTED", clientSocketId)
			})

			localPeer.on('signaling', data => {
				//console.log('SIGNAL', JSON.stringify(data))
				socket.emit("mcu_signaling", { instanceTo: "clientSocket", "clientSocketId": clientSocketId, data: data });
			})

			localPeer.on('stream', stream => {
				//console.log("Peer added stream!", stream)
				var streamId = stream.id.replace("{", "").replace("}", "");
				allStreams[streamId] = stream;

				var videoTracks = stream.getVideoTracks();
				var audioTracks = stream.getAudioTracks();
				if (videoTracks == 0) { //Only audio so generate a streamSource
					var scr = ac.createMediaStreamSource(stream);
					allStreamSources[streamId] = scr;
					peerAudioStreamSrcs[streamId] = streamId;

					var mediaEl = $('<audio autoplay="autoplay"></audio>'); //Stream is not active on chrome without this!
					mediaEl[0].srcObject = stream;
				} else { //its video so start get data
					var mediaEl = $('<video autoplay="autoplay"></video>'); //Stream is not active on chrome without this!
					mediaEl[0].srcObject = stream;
					$("body").append(mediaEl);

					var canvasEl = $('<canvas class="'+streamId+'"></canvas>');
					canvasEl.appendTo("body")
					var canvas = canvasEl[0]
					var ctx = canvas.getContext('2d');
					var rInterval = setInterval(function () {
						canvas.width = mediaEl[0].videoWidth;
						canvas.height = mediaEl[0].videoHeight;
						ctx.drawImage(mediaEl[0], 0, 0, canvas.width, canvas.height);
					}, 1000/mcuConfig.processingFPS);
					var canvasStream = canvas.captureStream(mcuConfig.processingFPS);
					console.log(canvasStream)
					secondStreamId = canvasStream.id;
					//allStreams[secondStreamId] = canvasStream;
					//allSecondStreamsIntervals[streamId] = rInterval;
					mediaEl.hide();

					var firstFrame = null;
					var mediaRecorder = new MediaRecorder(canvasStream,{mimeType:"video/webm; codecs=vp8"});
					allMediaRecorders[streamId] = mediaRecorder;
					mediaRecorder.onerror = function (err) {
						console.log(err);
					}
					console.log(mediaRecorder.mimeType)
					mediaRecorder.start(1000/mcuConfig.processingFPS);
					console.log("Start recording")
					var knownClients = {};
					mediaRecorder.ondataavailable = function (event) {
						if (event.data.size > 0) {
							var wasFirstFrame = false;
							if (!firstFrame) {
								wasFirstFrame = true;
								firstFrame = event.data;
								console.log("Set first frame!")
							}
							if (streamRecordSubs[streamId]) {
								for (var i in streamRecordSubs[streamId]) { //Send to all subs
									if (!knownClients[i]) { //Always send first frame because of encoding information
										knownClients[i] = true;
										// if(!wasFirstFrame) {
										// 	socket.emit("mcu_vid", { "cs": i, streamId: streamId, d: firstFrame }); //Send encoded data to client
										// 	console.log("send first frame!")
										// }
									}
									socket.emit("mcu_vid", { "cs": i, streamId: streamId, d: event.data }); //Send encoded data to client
								}
							}
						}
					}
					mediaRecorder.onstop = function (e) {
						console.log("STOPED")
						delete allMediaRecorders[streamId];
					}
				}

				var retObj = {
					hasVideo: videoTracks.length > 0 ? true : false,
					hasAudio: audioTracks.length > 0 ? true : false,
					streamId: streamId
				}
				//console.log(retObj)
				socket.emit("mcu_streamIsActive", mcuConfig.loadBalancerAuthKey, retObj) //to main instance
			});
		}

		setInterval(function () { //Every 10h get current IceServers
			socket.emit("mcu_reqCurrentIceServers", mcuConfig.loadBalancerAuthKey);
		}, 1000 * 60 * 60 * 10);


	});

	console.log("Loadbalancer runnung! Connecting to:", mcuConfig.masterURLAndPort);
}
