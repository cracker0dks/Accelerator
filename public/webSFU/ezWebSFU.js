var masterIp = "127.0.0.1:443"; //Or hostname
var socket = io('https://' + masterIp, { secure: true, reconnect: true, rejectUnauthorized: false });
var loadBalancerAuthKey = "abc"; //Auth key to connect to the master as loadBalancer
var lbConfig = {
	enabled: true, //set to false and the main server does not handle any streams (An other loadbalancer has to be online)
}

var allPeers = {};
var allStreams = {};
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

	socket.on('sfu_onUserDisconnectedFromRoom', function (clientSocketId) {
		if (allPeers[clientSocketId]) {
			allPeers[clientSocketId].destroy();
			delete allPeers[clientSocketId];
		}
	});

	socket.on('sfu_onStreamUnpublished', function (streamAttr) {
		var streamId = streamAttr["streamId"];
		if (allStreams[streamId]) {
			delete allStreams[streamId];
		}
	});

	socket.on('sfu_reqSteam', function (content) {
		console.log("sfu_reqSteam", content)
		var streamId = content.streamId;
		var clientSocketId = content.clientSocketId;
		if (allStreams[streamId]) {

			if(!allPeers[clientSocketId]) {
				createNewPeer(clientSocketId, allStreams[streamId], function () {
					console.log("Created peer and piped stream", clientSocketId, allStreams[streamId])
				});
			} else {
				console.log("piped stream", clientSocketId, allStreams[streamId])
				allPeers[clientSocketId].addStream(allStreams[streamId])
			}
		}
	});

	socket.on('sfu_reqPeerConnectionToLB', function (content) {
		console.log("sfu_reqPeerConnectionToLB", content)
		var clientSocketId = content.clientSocketId;

		if(!allPeers[clientSocketId]) {
			createNewPeer(clientSocketId, null, function () {
				console.log("Created peer!", clientSocketId)
			});
		}
	});	

	socket.emit("sfu_registerLoadBalancer", loadBalancerAuthKey, lbConfig);

	socket.on('sfu_signaling', function (content) {
		var data = content["data"];
		var clientSocketId = content["clientSocketId"];
		if(allPeers[clientSocketId])
			allPeers[clientSocketId].signaling(data);
	});

	function createNewPeer(clientSocketId, stream, callback) {
		var localPeer = new initEzWebRTC(true, { iceServers: iceServers, stream : stream })
		allPeers[clientSocketId] = localPeer;

		localPeer.on('error', function (err) {
			console.log('peererror', clientSocketId, err)
		});

		localPeer.on('disconnect', () => {
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
			var streamId = stream.id.replace("{", "").replace("}", "");
			console.log("NEW STREAM WAS ADDED TO LB", streamId)
			allStreams[streamId] = stream;

			socket.emit("sfu_streamIsActive", loadBalancerAuthKey, streamId) //to main instance
		});
	}

	setInterval(function () { //Every 10h get current IceServers
		socket.emit("sfu_reqCurrentIceServers", loadBalancerAuthKey, { enabled: enabled });
	}, 1000 * 60 * 60 * 10);
});

console.log("Loadbalancer runnung! Connecting to:", masterIp);