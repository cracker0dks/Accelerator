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
			]
		},
		loadBalancerAuthKey: (Math.random() + "").replace(".", ""), //Key for the loadbalancers to auth on the master (Must be the same on Master and loadbalancer)
		isMaster : true, //Set to false if this is a loadbalancer instance
		masterURL : 'https://yourAcceleratorURL.tl', //the web URL of your main instance (only used on loadbalancers)
		enableLocalMCU : true //Set to false if this is master and this server should not handle any streams -> be sure you set up a loadbalancer in that case
	},
	"accConfig": { 
		"etherpadUrl": "", //Set to an url to enable etherpad (https://yourURL.tl/etherpad/p/) 
		"deleteUnusedRoomsAfterDays": 0, //0 is no deletion at all
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
			fs.writeFile("./config/config.json", JSON.stringify(returnConfig, null, 4), function (err) { if(err) console.log(err) });

			//Write default config files
			fs.writeFile("./config/defaultConfig.json", JSON.stringify(defaultConfig, null, 4), function (err) { if(err) console.log(err) });
		}, 500)
		return JSON.parse(JSON.stringify(returnConfig)); //Return a copy from the org config
	}
}