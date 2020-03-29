$(document).ready(function () {
	$("#loadMCUBtn").click(function () {
		start()
	})
})

var mcuConfig = {
	enabled: true,
	loadBalancerAuthKey: "abc", //Auth key to connect to the master as loadBalancer
	masterURLAndPort: "http://127.0.0.1:8080", //IP Or hostname and port
	secure : false
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
	var iceServers = [];

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
			iceServers = newIceServers;
		});

		socket.on('mcu_onStreamUnpublished', function (streamAttr) {
			var streamId = streamAttr["streamId"];
			if (allStreams[streamId]) {
				delete allStreams[streamId];
			}
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
					allPeers[clientSocketId].addStream(allStreams[streamId]);
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

			var localPeer = new initEzWebRTC(true, { iceServers: iceServers, stream: dest.stream })
			allPeers[clientSocketId] = localPeer;

			localPeer.on('error', function (err) {
				console.log('peererror', clientSocketId, err)
			});

			localPeer.on('disconnect', () => {
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
				if (videoTracks == 0) { //Only audio
					var scr = ac.createMediaStreamSource(stream);
					allStreamSources[streamId] = scr;
					peerAudioStreamSrcs[streamId] = streamId;

					var mediaEl = $('<audio autoplay="autoplay"></audio>'); //Stream is not active on chrome without this!
					mediaEl[0].srcObject = stream;
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
