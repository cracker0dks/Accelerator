var fs = require('fs');

var defaultConfig = {
	"https": { "port": 443 },
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
		loadBalancerAuthKey: (Math.random() + "").replace(".", ""), //Key for the loadbalancers to auth on the master
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
			fs.writeFile("./config/config.json", JSON.stringify(returnConfig, null, 4), function (err) { });

			//Write default config files
			fs.writeFile("./config/defaultConfig.json", JSON.stringify(defaultConfig, null, 4), function (err) { });
		}, 500)
		return JSON.parse(JSON.stringify(returnConfig)); //Return a copy from the org config
	}
}