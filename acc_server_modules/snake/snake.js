var players = {};
var running = false;
var gameIntervals = {};
var updateFunction = null;
var endFunction = null;
var removePlayerFunction = null;
var updateEatableFunction = null;
var stepSize = 5;
var eatables = {};
var fieldWidth = 990;
var fieldHeight = 540;
module.exports = {
	startStopSnake : function(socketId,roomname,trueFalse) {
		var _this = this;
		if(!trueFalse) {
			removeThePlayer(socketId);
		} else {
			if(!players[roomname]) {
				players[roomname] = {};
			}
			players[roomname][socketId] = {
				"x" : 30,
				"y" : 0,
				"d" : "x+", //direction
				"t" : [{"x":0,"y":0},{"x":0,"y":0}], //tail
				"p" : 0
			}

			if(!running) {
				eatables[roomname] = {"x":getRandomInt(10, (fieldWidth-10), stepSize), "y":getRandomInt(10, (fieldHeight-10), stepSize)}; //Make first eatable

				gameIntervals[roomname] = setInterval(function() {
					for(var playerId in players[roomname]) {
						var player = players[roomname][playerId];
						if(player["d"]=="x+") {
							updatePlayerPosition(1,0)
						} else if(player["d"]=="y+") {
							updatePlayerPosition(0,1)
						} else if(player["d"]=="x-") {
							updatePlayerPosition(-1,0)
						} else if(player["d"]=="y-") {
							updatePlayerPosition(0,-1)
						}

						function updatePlayerPosition(x,y) {
							//Update Tail
							for(var i=player["t"].length-1;i>=0;i--) {
								if(i==0) {
									player["t"][i]["x"] = player["x"];
									player["t"][i]["y"] = player["y"];
								} else {
									player["t"][i]["x"] = player["t"][(i-1)]["x"];
									player["t"][i]["y"] = player["t"][(i-1)]["y"]
								}
							}
							player["x"]+=x*stepSize;
							player["y"]+=y*stepSize;
							if(player["x"]>fieldWidth) {
								player["x"] = 0;
							} else if(player["y"]>fieldHeight) {
								player["y"] = 0;
							} else if(player["x"]<0) {
								player["x"] = fieldWidth;
							} else if(player["y"]<0) {
								player["y"] = fieldHeight;
							}

							//Check collision with eatable
							if(isRecRecCollision(player["x"],player["y"],10,10,eatables[roomname]["x"],eatables[roomname]["y"],10,10)) {
								player["t"].push({"x":player["t"][player["t"].length-1]["x"],"y":player["t"][player["t"].length-1]["y"]});
								player["t"].push({"x":player["t"][player["t"].length-1]["x"],"y":player["t"][player["t"].length-1]["y"]});
								var newPlace = false;
								while(!newPlace) {
									newPlace = true;
									eatables[roomname] = {"x":getRandomInt(10, (fieldWidth-10), stepSize), "y":getRandomInt(10, (fieldHeight-10), stepSize)}; //Make new eatable
									for(var lplayerId in players[roomname]) {
										var cp = players[roomname][lplayerId];
										for(var i=0;i<cp["t"].length;i++) {
											if(isRecRecCollision(eatables[roomname]["x"],eatables[roomname]["y"],10,10,cp["t"][i]["x"],cp["t"][i]["y"],10,10)) { //Dont spawn on players tail
												newPlace=false;
												break;
											}
										}
									}
								}
								
								updateEatableFunction(roomname, eatables[roomname]);
							}


							for(var lplayerId in players[roomname]) {
								var cp = players[roomname][lplayerId];
								var i=0;
								if(lplayerId == playerId) {
									i=6; //Check own tail only after pos 6
								}
								
								//Check collision with tails
								for(i;i<cp["t"].length;i++) {
									if(isRecRecCollision(player["x"],player["y"],10,10,cp["t"][i]["x"],cp["t"][i]["y"],10,10)) {
										players[roomname][lplayerId]["p"]++;
										showSnakeStatsFunction(roomname, players[roomname]);
										removeThePlayer(playerId);
										break;
									}
								}
								
							}
						}
					}
					updateFunction(roomname, players[roomname]);
				}, 40);
			}
			updateEatableFunction(roomname, eatables[roomname]);
			running = true;
		}

		function removeThePlayer(newsocketId) {
			if(players[roomname])
				delete players[roomname][newsocketId];
			removePlayerFunction(roomname, newsocketId);
			if(JSON.stringify(players[roomname])=="{}") {
				_this.stopGame(roomname);
			}
		}
	},
	snakeKeyPressed: function(socketId,roomname, key) {
		if(players[roomname] && players[roomname][socketId]) {
			var player = players[roomname][socketId];
			if(key==39) {//Right
				if(player["d"]=="x+") {
					player["d"] = "y+";
				} else if(player["d"]=="y+") {
					player["d"] = "x-";
				} else if(player["d"]=="x-") {
					player["d"] = "y-";
				} else if(player["d"]=="y-") {
					player["d"] = "x+";
				}
			} else if(key==37) {
				if(player["d"]=="x+") {
					player["d"] = "y-";
				} else if(player["d"]=="y+") {
					player["d"] = "x+";
				} else if(player["d"]=="x-") {
					player["d"] = "y+";
				} else if(player["d"]=="y-") {
					player["d"] = "x-";
				}
			}
		}
	},
	addGameCallbacks : function(updateCallback, endCallback, removePlayerCallback, updateEatableCallback, showSnakeStatsCallback) {
		updateFunction = updateCallback;
		endFunction = endCallback;
		removePlayerFunction = removePlayerCallback;
		updateEatableFunction = updateEatableCallback;
		showSnakeStatsFunction = showSnakeStatsCallback;
	},
	stopGame : function(roomname) {
		if(running) {
			running = false;
			clearInterval(gameIntervals[roomname]);
			endFunction(roomname);
			console.log("EndSnakeGame");
		}
	}
}

function getRandomInt(min, max, mod) {
	var r = Math.floor(Math.random() * (max - min + 1)) + min;
	if(mod)
		r = r - (r%mod);
    return r;
}

function isRecRecCollision(rx1,ry1,rw1,rh1,rx2,ry2,rw2,rh2) {
	return rx1 < rx2 + rw2 && rx1 + rw1 > rx2 && ry1 < ry2 + rh2 && rh1 + ry1 > ry2;
}