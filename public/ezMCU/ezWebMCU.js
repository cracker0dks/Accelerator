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
	processingFPS: 15
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
			if (allEncodeTimeouts[streamId])
				clearInterval(allEncodeTimeouts[streamId])
			if (allEncodeWorkers[streamId]) {
				allEncodeWorkers[streamId].terminate();
				allEncodeWorkers[streamId] = null;
			}

			$("." + streamId).remove();
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
					var mediaEl = $('<video class="' + streamId + '" autoplay="autoplay"></video>'); //Stream is not active on chrome without this!
					mediaEl[0].srcObject = stream;
					var localVideo = mediaEl[0];
					$("body").append(mediaEl);

					var canvasEl = $('<canvas class="' + streamId + '"></canvas>');
					canvasEl.appendTo("body")
					var localCanvas = canvasEl[0]
					var localContext = localCanvas.getContext('2d');

					var canvasEl1 = $('<canvas class="' + streamId + '"></canvas>');
					canvasEl1.appendTo("body")
					var remoteCanvas = canvasEl1[0]
					var remoteContext = remoteCanvas.getContext('2d');

					const src = '../js/webm-wasm/vpx-worker.js';
					const vpxenc_ = new Worker(src);
					const vpxdec_ = new Worker(src);


					allEncodeWorkers[streamId] = vpxenc_;

					const vpxconfig_ = {};

					const width = 640;
					const height = 480;
					const fps = 15;
					var frames = 0;
					var bytesSent = 0;
					var lastTime = Date.now();

					localCanvas.width = width;
					localCanvas.height = height;

					remoteCanvas.width = width;
					remoteCanvas.height = height;

					vpxconfig_.codec = 'VP8';
					vpxconfig_.width = width;
					vpxconfig_.height = height;
					vpxconfig_.fps = fps;
					vpxconfig_.bitrate = 600;
					vpxconfig_.packetSize = 16;

					vpxenc_.postMessage({ type: 'init', data: vpxconfig_ });

					vpxdec_.postMessage({ type: 'init', data: vpxconfig_ });

					let encoding = false;
					setTimeout(() => {
						allEncodeTimeouts[streamId] = setInterval(() => {
							if (encoding) return; // TODO: apprtc is a bit smarter here.
							encoding = true;
							localContext.drawImage(localVideo, 0, 0, width, height);
							const frame = localContext.getImageData(0, 0, width, height);
							vpxenc_.postMessage({
								id: 'enc',
								type: 'call',
								name: 'encode',
								args: [frame.data.buffer]
							}, [frame.data.buffer]);

						}, 1000.0 / fps);
					}, 1000); // wait a bit before grabbing frames to give the wasm stuff time to init.

					var statsInt = setInterval(function () {
						const now = Date.now();
						console.log('bitrate', Math.floor(8000.0 * bytesSent / (now - lastTime)),
							'fps', Math.floor(1000.0 * frames / (now - lastTime)));
						bytesSent = 0;
						frames = 0;
						lastTime = now;
						if (!allEncodeWorkers[streamId]) {
							clearInterval(statsInt)
						}
					}, 1000)

					vpxenc_.onmessage = e => {
						encoding = false;
						if (e.data.res) {
							const encoded = new Uint8Array(e.data.res);
							console.log(e.data.res)
							for (var i in streamRecordSubs[streamId]) { //Send to all subs
								socket.emit("mcu_vid", { "cs": i, streamId: streamId, d: e.data.res });
							}


							bytesSent += encoded.length;
							frames++;

							// vpxdec_.postMessage({
							// 	id: 'dec',
							// 	type: 'call',
							// 	name: 'decode',
							// 	args: [e.data.res],
							// }, [e.data.res]);
						}
					};

					vpxdec_.onmessage = e => {
						if (e.data.res) {
							const decoded = new Uint8Array(e.data.res);
							const frame = remoteContext.createImageData(width, height);
							frame.data.set(decoded, 0);
							remoteContext.putImageData(frame, 0, 0);
						}
					};

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

		function typedArrayToBuffer(array) {
			return array.buffer.slice(array.byteOffset, array.byteLength + array.byteOffset)
		}

		setInterval(function () { //Every 10h get current IceServers
			socket.emit("mcu_reqCurrentIceServers", mcuConfig.loadBalancerAuthKey);
		}, 1000 * 60 * 60 * 10);


	});

	console.log("Loadbalancer runnung! Connecting to:", mcuConfig.masterURLAndPort);
}
