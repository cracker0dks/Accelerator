$(document).ready(function () {
	$("#loadSFUBtn").click(function () {
		start()
	})
})
function start() {
	var masterIp = "127.0.0.1:443"; //Or hostname
	var socket = io('https://' + masterIp, { secure: true, reconnect: true, rejectUnauthorized: false });
	var loadBalancerAuthKey = "abc"; //Auth key to connect to the master as loadBalancer
	var lbConfig = {
		enabled: true, //set to false and the main server does not handle any streams (An other loadbalancer has to be online)
	}

	var ac = new AudioContext();

	var allPeers = {};
	var allStreams = {};
	var allStreamDestinations = {};
	var allStreamSources = {};
	var iceServers = [];

	socket.on('connect', function () {
		console.log("Conntected to Master Server, waiting for streams to balance...");

		socket.on('disconnect', function () {
			console.log("DISCONNECTED from Master Server!")
			for (var i in allPeers) {
				allPeers[i].destroy();
			}
			allPeers = {};
			allStreams = {};
		});

		socket.on('sfu_onIceServers', function (newIceServers) {
			iceServers = newIceServers;
		});

		socket.on('sfu_onStreamUnpublished', function (streamAttr) {
			var streamId = streamAttr["streamId"];
			if (allStreams[streamId]) {
				delete allStreams[streamId];
			}
		});

		socket.on('sfu_reqSteam', function (content) {
			//console.log("sfu_reqSteam", content)
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
				var audioTracks = allStreams[streamId].getAudioTracks(); //Here do some things...
				var videoTracks = allStreams[streamId].getVideoTracks();
				if (videoTracks.length > 0) {
					allPeers[clientSocketId].addStream(allStreams[streamId]);
				} else if (audioTracks.length > 0) {
					if (allStreamSources[streamId] && allStreamDestinations[clientSocketId]) {
						allStreamSources[streamId].connect(allStreamDestinations[clientSocketId])

						var mediaEl = $('<audio autoplay="autoplay"></audio>'); //Stream is not active on chrome without this!
						mediaEl[0].srcObject = allStreamDestinations[clientSocketId].stream;
					} else {
						console.log("missing src or dest to connect audio!")
					}
				} else {
					console.log("no stream, say what ?!!")
				}
			}
		});

		socket.on('sfu_reqPeerConnectionToLB', function (content) {
			//console.log("sfu_reqPeerConnectionToLB", content)
			var clientSocketId = content.clientSocketId;

			if (!allPeers[clientSocketId]) {
				createNewPeer(clientSocketId, function () {
					//console.log("Created peer!", clientSocketId)
				});
			}
		});

		socket.emit("sfu_registerLoadBalancer", loadBalancerAuthKey, lbConfig);

		socket.on('sfu_signaling', function (content) {
			var data = content["data"];
			var clientSocketId = content["clientSocketId"];
			if (allPeers[clientSocketId])
				allPeers[clientSocketId].signaling(data);
		});

		function createNewPeer(clientSocketId, callback) {

			var dest = ac.createMediaStreamDestination();
			allStreamDestinations[clientSocketId] = dest;

			var localPeer = new initEzWebRTC(true, { iceServers: iceServers, stream: dest.stream })
			allPeers[clientSocketId] = localPeer;

			localPeer.on('error', function (err) {
				console.log('peererror', clientSocketId, err)
			});

			localPeer.on('disconnect', () => {
				allPeers[clientSocketId].destroy();
				delete allPeers[clientSocketId];
			})

			localPeer.on('connect', () => {
				callback();
				console.log("CONNECTED", clientSocketId)
			})

			localPeer.on('signaling', data => {
				allPeers[clientSocketId]["createdAnswer"] = true;
				//console.log('SIGNAL', JSON.stringify(data))
				socket.emit("sfu_signaling", { instanceTo: "clientSocket", "clientSocketId": clientSocketId, data: data });
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

					var mediaEl = $('<audio autoplay="autoplay"></audio>'); //Stream is not active on chrome without this!
					mediaEl[0].srcObject = stream;
				}

				var retObj = {
					hasVideo: videoTracks.length > 0 ? true : false,
					hasAudio: audioTracks.length > 0 ? true : false,
					streamId: streamId
				}
				//console.log(retObj)
				socket.emit("sfu_streamIsActive", loadBalancerAuthKey, retObj) //to main instance
			});
		}

		setInterval(function () { //Every 10h get current IceServers
			socket.emit("sfu_reqCurrentIceServers", loadBalancerAuthKey, { enabled: enabled });
		}, 1000 * 60 * 60 * 10);
	});

	console.log("Loadbalancer runnung! Connecting to:", masterIp);
}
