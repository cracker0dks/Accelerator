const workerSrc = '../js/webm-wasm/vpx-worker.js';

$(document).ready(function () {
	$("#loadMCUBtn").click(function () {
		start()
	})
})

var mcuConfig = {
	enabled: true,
	loadBalancerAuthKey: "abc", //Auth key to connect to the master as loadBalancer
	masterURL: "http://127.0.0.1:8080", //IP Or hostname and port
	secure: false,
	webRtcConfig: {},
	processingFPS: 15
}

function setMCUConfig(config) {
	for (var i in config) {
		mcuConfig[i] = config[i];
	}
	if (mcuConfig.isMaster) {
		mcuConfig.masterURL = "http://127.0.0.1:" + mcuConfig.masterPort
	}
	mcuConfig.secure = mcuConfig.masterURL.startsWith("https://") ? true : false;
}

function start() {

	var socket = io(mcuConfig.masterURL, { secure: mcuConfig.secure, reconnect: true, rejectUnauthorized: false });

	var ac = new AudioContext();

	var allPeers = {};
	var allStreams = {};
	var allStreamDestinations = {};
	var allStreamSources = {};
	var streamRecordSubs = {};
	var allEncodeWorkers = {};
	var allEncodeTimeouts = {};

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
			if (allEncodeTimeouts[streamId]) {
				clearInterval(allEncodeTimeouts[streamId])
				allEncodeTimeouts[streamId] = null;
			}
			if (allEncodeWorkers[streamId]) {
				allEncodeWorkers[streamId].terminate();
				allEncodeWorkers[streamId] = null;
			}
			delete streamRecordSubs[streamId];
			$("." + streamId).remove();
		});

		socket.on('mcu_reqSteam', function (content) {
			//console.log("mcu_reqSteam", content)
			var streamId = content && content.streamId ? content.streamId.replace("{", "").replace("}", "") : 0;
			var clientSocketId = content.clientSocketId;
			var sendPeerVideo = content.sendPeerVideo;
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
					if (mcuConfig.enableGlobalVideoProcessing && audioTracks.length == 0 && !sendPeerVideo) { //Not working if we have audiotracks
						if (!streamRecordSubs[streamId]) { streamRecordSubs[streamId] = {} };
						streamRecordSubs[streamId][clientSocketId] = true;
					} else {
						allPeers[clientSocketId].addStream(allStreams[streamId]); //Add stream to peer connection
					}
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
			var allPeerEncodingStreams = [];
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

				for (var i in allPeerEncodingStreams) {
					var streamId = allPeerEncodingStreams[i];
					if (allEncodeTimeouts[streamId])
						clearInterval(allEncodeTimeouts[streamId])
					if (allEncodeWorkers[streamId]) {
						allEncodeWorkers[streamId].terminate();
						allEncodeWorkers[streamId] = null;
					}
					$("." + streamId).remove();
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

				var retObj = {
					hasVideo: videoTracks.length > 0 ? true : false,
					hasAudio: audioTracks.length > 0 ? true : false,
					streamId: streamId
				}

				if (videoTracks == 0) { //Only audio so generate a streamSource
					var scr = ac.createMediaStreamSource(stream);
					allStreamSources[streamId] = scr;
					peerAudioStreamSrcs[streamId] = streamId;

					var mediaEl = $('<audio autoplay="autoplay"></audio>'); //Stream is not active on chrome without this!
					mediaEl[0].srcObject = stream;

					//console.log(retObj)
					socket.emit("mcu_streamIsActive", mcuConfig.loadBalancerAuthKey, retObj) //to main instance
				} else if (mcuConfig.enableGlobalVideoProcessing && audioTracks.length == 0) { //if not, streams send via peer connection
					allPeerEncodingStreams.push(streamId);
					var mediaEl = $('<video class="' + streamId + '" autoplay="autoplay"></video>'); //Stream is not active on chrome without this!
					var localVideo = mediaEl[0];
					localVideo.srcObject = stream;

					$("body").append(mediaEl);

					localVideo.addEventListener("canplay", function () {
						mediaEl.hide();
						var canvasEl = $('<canvas class="' + streamId + '"></canvas>');
						//canvasEl.appendTo("body")
						var localCanvas = canvasEl[0]
						var localContext = localCanvas.getContext('2d');

						const vpxenc_ = new Worker(workerSrc);
						allEncodeWorkers[streamId] = vpxenc_;

						const vpxconfig_ = {};

						const width = localVideo.videoWidth;
						const height = localVideo.videoHeight;

						retObj["videoWidth"] = width;
						retObj["videoHeight"] = height;
						socket.emit("mcu_streamIsActive", mcuConfig.loadBalancerAuthKey, retObj) //to main instance

						vpxconfig_.codec = "VP8";
						vpxconfig_.width = width;
						vpxconfig_.height = height;
						vpxconfig_.fps = mcuConfig.processingFPS;
						vpxconfig_.bitrate = mcuConfig.processingBitrate;
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

							}, 1000.0 / mcuConfig.processingFPS);
						}, 1000); // wait a bit before grabbing frames to give the wasm stuff time to init.

						vpxenc_.onmessage = e => {
							encoding = false;
							if (e.data.res) {
								for (var i in streamRecordSubs[streamId]) { //Send to all subs
									socket.emit("mcu_vid", { "cs": i, streamId: streamId, d: e.data.res });
								}
							}
						};
					});
				} else { //Audio and video... should not be called on acc					
					socket.emit("mcu_streamIsActive", mcuConfig.loadBalancerAuthKey, retObj) //to main instance
				}
			});
		}

		setInterval(function () { //Every 10h get current IceServers
			socket.emit("mcu_reqCurrentIceServers", mcuConfig.loadBalancerAuthKey);
		}, 1000 * 60 * 60 * 10);


	});

	console.log("Loadbalancer runnung! Connecting to:", mcuConfig.masterURL);
}