var fs = require('fs');

var defaultConfig = {
	"http": { "port": 8080 },
	"mcuConfig": {
		webRtcConfig: { //This is the configs for the peer connections
			iceServers: [
				{
					urls: "stun:stun.l.google.com:19302",
				},
				// {
				//     urls: "stun:yourStunServerIP?transport=udp",
				//     username: "username",
				//     credential: "123456"
				// },
				// {
				//     urls: "turn:YourTurnServerIp?transport=tcp",
				//     username: "username",
				//     credential: "123456"
				// },
			],
			"preferH264Codec": false //Set to true to prefer the use of h264 if possible; This might reduce cpu load for video processing because we can might use hardware acceleration. Note that you have to use chrome in puppeteer (not chromium)
		},
		loadBalancerAuthKey: (Math.random() + "").replace(".", ""), //Key for the loadbalancers to auth on the master (Must be the same on Master and loadbalancer)
		isMaster: true, //Set to false if this is a loadbalancer instance
		masterURL: 'https://yourAcceleratorURL.tl', //the web URL of your main instance
		enableLocalMCU: true, //Set to false if this is master and this server should not handle any streams -> be sure you set up a loadbalancer in that case
		enableGlobalVideoProcessing: false, //If true: All Videostreams will be encoded once (not everytime for every downstream) and send back via websockets (not webRTC). Far less server cpu usage but no WebRTC features on downstreams
		processingFPS: 20, //FPS for Video proccesing on the MCU (Less is better for cpu usage but laggy)
		processingBitrate: 600 //Default 600
	},
	"accConfig": {
		"etherpadUrl": "", //Set to an url to enable etherpad (https://yourURL.tl/etherpad/p/) 
		"deleteUnusedRoomsAfterDays": 0, //0 is no deletion at all
		"screenshareConfig": {
			"maxFPS": 20,
			"maxResolution": "720p" //1080p, 720p, 480p, 360p
		},
		"webcamConfig": {
			"maxFPS": 20,
			"maxResolution": "480p" //1080p, 720p, 480p, 360p
		},
		"userCntVideoShareLimit": 6, //video will be disable for users (only enabled for moderators) after this mutch users in one room
		"enableClientVideoProcessing" : false //If true the videostreams will be encoded once on the client and send via websockets (not webRTC) to the server. This will use close to zero server cpu usage but no WebRTC features on up and dowstreams (Also might not work well on slow devices)"
	}
}

module.exports = {
	getConfigs: function () {
		if (!fs.existsSync("./config")) {
			fs.mkdirSync("./config");
		}

		var returnConfig = JSON.parse(JSON.stringify(defaultConfig)); //Copy default config
		if (fs.existsSync('./config/config.json')) {
			var conf = fs.readFileSync('./config/config.json', 'utf8');
			var newConfig = JSON.parse(conf);
			for (var i in newConfig) {
				for (var k in newConfig[i]) {
					returnConfig[i][k] = newConfig[i][k];
				}
			}
		}

		setTimeout(function () {
			fs.writeFile("./config/config.json", JSON.stringify(returnConfig, null, 4), function (err) { if (err) console.log(err) });

			//Write default config files
			fs.writeFile("./config/defaultConfig.json", JSON.stringify(defaultConfig, null, 4), function (err) { if (err) console.log(err) });
		}, 500)
		return JSON.parse(JSON.stringify(returnConfig)); //Return a copy from the org config
	}
}