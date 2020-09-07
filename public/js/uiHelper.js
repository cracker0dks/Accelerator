var pitemWebcamStreams = {};
var allRooms = {};

function addUserPItem(content) {
	var userId = content.userId;
	var itemUsername = content.itemUsername;
	var item = content.item;
	var posX = content.posX;
	var posY = content.posY;
	var itemId = content.itemId;
	var usercolor = content.color;
	var width = content.width;
	var height = content.height;
	var text = content.text || "";
	var oldDrawBuffer = content.drawBuffer;
	var praesislide = content.praesislide || 0;
	var praesiname = content.praesiname || "";
	var drawable = content.lockUnlock || false;
	var canvasCursor = "pointer";
	if (drawable) {
		canvasCursor = "crosshair";
	}
	var transparent = content.transparent || false;

	var drop = "";
	if (item == 'sqare') {
		drop = $('<i class="fa fa-square"></i>');
		drop.css({ "color": usercolor, "font-size": "1.3em" });
	} else if (item == 'circle') {
		drop = $('<i class="fa fa-circle"></i>');
		drop.css({ "color": usercolor, "font-size": "1.3em" });
	} else if (item == 'heart') {
		drop = $('<i class="fa fa-heart"></i>');
		drop.css({ "color": usercolor, "font-size": "1.3em" });
	} else if (item == 'caret-up') {
		drop = $('<i class="fa fa-caret-up"></i>');
		drop.css({ "color": usercolor, "font-size": "2.3em" });
	} else if (item == 'caret-down') {
		drop = $('<i class="fa fa-caret-down"></i>');
		drop.css({ "color": usercolor, "font-size": "2.3em" });
	} else if (item == 'caret-right') {
		drop = $('<i class="fa fa-caret-right"></i>');
		drop.css({ "color": usercolor, "font-size": "2.3em" });
	} else if (item == 'caret-left') {
		drop = $('<i class="fa fa-caret-left"></i>');
		drop.css({ "color": usercolor, "font-size": "2.3em" });
	} else if (item == 'star') {
		drop = $('<i class="fa fa-star"></i>');
		drop.css({ "color": usercolor, "font-size": "1.3em" });
	} else if (item == 'cloud') {
		drop = $('<i class="fa fa-cloud"></i>');
		drop.css({ "color": usercolor, "font-size": "1.3em" });
	} else if (item == 'arrowUp') {
		drop = $('<i class="fa fa-arrow-up"></i>');
		drop.css({ "color": usercolor, "font-size": "1.3em" });
	} else if (item == 'arrowDown') {
		drop = $('<i class="fa fa-arrow-down"></i>');
		drop.css({ "color": usercolor, "font-size": "1.3em" });
	} else if (item == 'numberone') {
		drop = $('<i class="fa numberone">1</i>');
		drop.css({ "color": usercolor, "font-size": "1.3em", "font-weight": "bold", "font-family": "sans-serif" });
	} else if (item == 'numbertwo') {
		drop = $('<i class="fa numbertwo">2</i>');
		drop.css({ "color": usercolor, "font-size": "1.3em", "font-weight": "bold", "font-family": "sans-serif" });
	} else if (item == 'numberthree') {
		drop = $('<i class="fa numberthree">3</i>');
		drop.css({ "color": usercolor, "font-size": "1.3em", "font-weight": "bold", "font-family": "sans-serif" });
	} else if (item == 'numberfour') {
		drop = $('<i class="fa numberfour">4</i>');
		drop.css({ "color": usercolor, "font-size": "1.3em", "font-weight": "bold", "font-family": "sans-serif" });
	} else if (item == 'numberfive') {
		drop = $('<i class="fa numberfive">5</i>');
		drop.css({ "color": usercolor, "font-size": "1.3em", "font-weight": "bold", "font-family": "sans-serif" });
	} else if (item == 'numbersix') {
		drop = $('<i class="fa numbersix">6</i>');
		drop.css({ "color": usercolor, "font-size": "1.3em", "font-weight": "bold", "font-family": "sans-serif" });
	} else if (item == 'numberseven') {
		drop = $('<i class="fa numberseven">7</i>');
		drop.css({ "color": usercolor, "font-size": "1.3em", "font-weight": "bold", "font-family": "sans-serif" });
	} else if (item == 'numbereight') {
		drop = $('<i class="fa numbereight">8</i>');
		drop.css({ "color": usercolor, "font-size": "1.3em", "font-weight": "bold", "font-family": "sans-serif" });
	} else if (item == 'numbernine') {
		drop = $('<i class="fa numbernine">9</i>');
		drop.css({ "color": usercolor, "font-size": "1.3em", "font-weight": "bold", "font-family": "sans-serif" });
	} else if (item == 'numbernull') {
		drop = $('<i class="fa numbernull">0</i>');
		drop.css({ "color": usercolor, "font-size": "1.3em", "font-weight": "bold", "font-family": "sans-serif" });
	} else if (item == 'camera') {
		if (getUserNameFromId(userId) == "notFound!") { //User not at the page, dont render!
			sendRemoveUserPItem(itemId, userId);  //Remove the item
		} else {
			var thisHeight = height ? height : 250;
			var thisWidth = width ? width : 345;
			drop = $('<div class="cameraUserPitem' + userId + '" style="color: silver; border-radius: 5px; font-size: 0.9em; border: 1px solid silver; background: rgba(226, 220, 220, 0.56); width:' + thisWidth + 'px; min-height:250px; height:' + thisHeight + 'px;  min-width: 345px;">' +
				'<span style="padding-left:3px; float: left;"><i class="fa fa-video-camera"></i> ' + itemUsername + '</span>' +
				'<p class="dragzone" style="width:100%; height:15px; position:absolute; top:0px; left:0px;"></p><br>' +
				'<button class="trash" style="display:none; position:absolute; right:0px; top:0px; background: #ffffff00; border:1px solid transparent; height: 17px; "><i class="fa fa-trash-o"></i></button>' +
				'<button title="save current frame of the videostream" class="saveFrameBtn" style="display:none; position:absolute; right:15px; top:0px; background: #ffffff00; border:1px solid transparent; height: 17px; "><i class="fa fa-floppy-o"></i></button>' +
				'<div style="background:white; color:black; text-align: center; width:100%; height:' + (thisHeight - 27) + 'px;" class="innerContent"><br><br>Wait for action from user...</div>' +
				'</div>');
			if (userId == ownSocketId || roomImIn["moderator"] == ownSocketId || username == itemUsername) {
				drop.resizable({
					resize: function (event, ui) {
						$("#praesiDragOverlay").show();
						if (ui.size.height >= 250 && ui.size.width >= 345) {
							drop.find(".innerContent, video").css({ "height": (ui.size.height - 27) + "px" });
							sendChangeElementSize(itemId, ui.size.width, ui.size.height);
						}
					},
					stop: function (event, ui) {
						$("#praesiDragOverlay").hide();
					}
				});
			}
			if (userId == ownSocketId) {
				var insDiv = $('<div><br><br>Select the Webcam you want to stream: <select></select><br>' +
					'<button style="padding: 10px;" class="btn btn-primary">Start streaming</button>' +
					'</div>');
				drop.find(".innerContent").html(insDiv);
				navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError);
				function gotDevices(deviceInfos) {
					var found = false;
					for (var i = 0; i < deviceInfos.length; i++) {
						var deviceInfo = deviceInfos[i];
						if (deviceInfo.kind === 'videoinput') {
							var camName = deviceInfo.label || "Cam" + i;
							insDiv.find("select").append('<option value="' + deviceInfo.deviceId + '">' + camName + '</option>');
							found = true;
						}
					}
					if (!found) {
						drop.find(".innerContent").html('Sry, no camera found on your PC!');
					} else {
						drop.find(".innerContent").find("button").click(function () {
							var _this = this;
							var config = {
								audio: false,
								video: { mandatory: { "sourceId": drop.find("select").val() } }
							};
							writeToChat("Server", "Try to access webcam!");
							$(_this).hide();
							navigator.getUserMedia(config, (stream) => {
								stream["streamAttributes"] = { socketId: ownSocketId, itemId: itemId, username: username };
								pitemWebcamStreams[itemId] = stream;
								myMCU.publishStreamToRoom(roomImIn["roomName"], stream, function (err) {
									if (err) {
										writeToChat("ERROR", "Stream could not be published! Error: " + err);
									} else {
										writeToChat("Server", "Webcamstream connecting...");
										drop.find(".innerContent").html('<br><br>connecting...');

									}
								});
							}, (err) => {
								writeToChat("ERROR", "Access to webcam rejected or device not available!");
								$(_this).show();
							})
						});
					}
				}
				function handleError(error) {
					console.log(error);
				}
			}
			drop.css({ "background": usercolor, "color": invertColor(usercolor) });
		}
	} else if (item == 'image') {
		var thisHeight = height ? height : 200;
		var thisWidth = width ? width : 300;
		drop = $('<div style="color: silver; border-radius: 5px; font-size: 0.9em; border: 1px solid silver; background: rgba(226, 220, 220, 0.56); width:' + thisWidth + 'px; min-height:200px; height:' + thisHeight + 'px;  min-width: 300px;">' +
			'<span style="padding-left:3px; float: left;"><i class="fa fa-picture-o"></i> ' + itemUsername + '</span><br>' +
			'<button title="toggle background transparent" class="makeTransparent" style="display:none; position:absolute; right:15px; top:0px; background: #ffffff00; height: 17px; border:1px solid transparent;"><i class="fa fa-low-vision"></i></button>' +
			'<button class="trash" style="display:none; position:absolute; right:0px; top:0px; background: #ffffff00; height: 17px; border:1px solid transparent;"><i class="fa fa-trash-o"></i></button>' +
			'<div style="color:black; text-align: center; width:100%; height:' + (thisHeight - 27) + 'px;" class="innerContent"><br><br>Wait for action from user...</div>' +
			'</div>');
		if (userId == ownSocketId || roomImIn["moderator"] == ownSocketId || username == itemUsername) {
			drop.find(".makeTransparent").show();
			drop.find(".makeTransparent").click(function () {
				if (drop.hasClass("transparent")) {
					sendMakeTransparent(itemId, false);
				} else {
					sendMakeTransparent(itemId, true);
				}
			});
			drop.resizable({
				resize: function (event, ui) {
					$("#praesiDragOverlay").show();
					if (ui.size.height >= 200) {
						drop.find(".innerContent").css({ "height": (ui.size.height - 27) + "px" });
						sendChangeElementSize(itemId, ui.size.width, ui.size.height);
					}
				},
				stop: function (event, ui) {
					$("#praesiDragOverlay").hide();
				}
			});
			if ((userId == ownSocketId || username == itemUsername) && text == "") {
				if (text == "") {
					var input = $('<div>' +
						'1. Upload Image (Bottom right on this Site) <i style="color: gray;" class="mdi-file-cloud"></i><br>' +
						'2. Select your uploaded Image:' +
						'<select class="allSingleFilesSelect" style="min-width:200px;"></select><br>' +
						'<button style="padding: 10px;" class="btn btn-primary">Complete</button>' +
						'</div>');
					for (var i in allSingleFiles) {
						var filename = allSingleFiles[i]["filename"];
						if (isImageFileName(filename)) {
							input.find("select").append('<option value="/singlefiles/' + filename + '">' + filename + '</option>');
						}
					}

					input.find("button").click(function () {
						var val = input.find("select").val();
						if (val && val != "")
							sendSetUserPItemsText(val, itemId, true);
					});
					drop.find(".innerContent").html(input);
				}
			}

		}
		if (text != "") {
			var image = $('<img style="width: 100%; max-height: 100%;" src="' + document.URL.substr(0, document.URL.lastIndexOf('/')) + '' + text + '">');
			drop.find(".innerContent").html(image);
		}
		drop.css({ "background": usercolor, "color": invertColor(usercolor) });

	} else if (item == 'textfield') {
		var thisHeight = height ? height : 200;
		var thisWidth = width ? width : 300;
		drop = $('<div style="color: silver; border-radius: 5px; font-size: 0.9em; border: 1px solid silver; background: rgba(226, 220, 220, 0.56); width:' + thisWidth + 'px; height:' + thisHeight + 'px;  min-width: 100px; min-height: 50px;">' +
			'<span style="padding-left:3px; float: left;"><i class="fa fa-file-text-o"></i> ' + itemUsername + '</span><br>' +
			'<button class="trash" style="display:none; position:absolute; right:0px; top:0px; background: #ffffff00; height: 17px; border:1px solid transparent;"><i class="fa fa-trash-o"></i></button>' +
			'<textarea class="innerContent" style="color: rgb(94, 91, 91); resize: none; width:100%; height:' + (thisHeight - 27) + 'px;">' + text + '</textarea>' +
			'</div>');
		if (userId == ownSocketId || roomImIn["moderator"] == ownSocketId || username == itemUsername) {
			drop.find("textarea").on('keyup', function () {
				sendSetUserPItemsText($(this).val(), itemId)
			});
			drop.resizable({
				resize: function (event, ui) {
					$("#praesiDragOverlay").show();
					if (ui.size.height >= 50) {
						drop.find(".innerContent").css({ "height": (ui.size.height - 27) + "px" });
						sendChangeElementSize(itemId, ui.size.width, ui.size.height);
					}
				},
				stop: function (event, ui) {
					$("#praesiDragOverlay").hide();
				}
			});
		} else {
			drop.find("textarea").attr({ "readonly": "true" });
		}
		drop.css({ "background": usercolor, "color": invertColor(usercolor) });

	} else if (item == 'pencil-square') {
		var thisHeight = height ? height : 200;
		var thisWidth = width ? width : 300;
		drop = $('<div style="color: silver; border-radius: 5px; font-size: 0.9em; border: 1px solid silver; padding-bottom: 5px; background: rgba(226, 220, 220, 0.56); height:' + thisHeight + 'px; min-width: 170px; min-height: 127px;"><div style="padding-left:3px; float:left;"><i class="fa fa-pencil-square-o"></i> ' +
			itemUsername + '</div>' +
			'<div style="display:none;" class="colorToPickContainer">' +
			'<button class="colorToPickDiv" color="red" style="background:red;"></button>' +
			'<button class="colorToPickDiv" color="blue" style="background:blue;"></button>' +
			'<button class="colorToPickDiv" color="yellow" style="background:yellow;"></button>' +
			'<button class="colorToPickDiv" color="green" style="background:green;"></button>' +
			'<button class="colorToPickDiv" color="black" style="background:black;"></button>' +
			'<button class="colorToPickDiv" color="white" style="background:white;"></button>' +
			'<button title="eraser" class="colorToPickDiv" color="alpha" style="width: 11px; border-radius: 2px; background:white; color:black; font-size: 0.7em;"><i class="fa fa-eraser" aria-hidden="true"></i></button>' +
			'</div>' +
			'<button class="trash" style="display:none; position:absolute; right:0px; top:0px; background: #ffffff00; height: 17px; border:1px solid transparent;"><i class="fa fa-trash-o"></i></button>' +
			'<button title="save current drawing to image file" class="saveFrameBtn" style="display:none; position:absolute; right:15px; top:0px; background: #ffffff00; border:1px solid transparent; height: 17px; "><i class="fa fa-floppy-o"></i></button>' +
			'<button title="allow other users to draw as well" class="lockUnlockCanvas" style="position:absolute; display:none; right:30px; top:1px; background: #ffffff00; height: 17px; border:1px solid transparent;"><i class="fa fa fa-lock"></i></button>' +
			'<button title="toggle background transparent" class="makeTransparent" style="display:none; position:absolute; right:45px; top:0px; background: #ffffff00; height: 17px; border:1px solid transparent;"><i class="fa fa-low-vision"></i></button>' +
			'<br><hr style="margin: 0px;"><div style="width:' + thisWidth + 'px; height:' + (thisHeight - 27) + 'px; overflow:hidden; min-height:100px; min-width:170px;" class="innerContent"><canvas drawable="' + drawable + '" style="cursor: ' + canvasCursor + ';background: white; width:2000; height:1500px;"></canvas></div>' +
			'</div>');

		if (drawable) {
			drop.find(".lockUnlockCanvas").find("i").removeClass("fa-lock");
			drop.find(".lockUnlockCanvas").find("i").addClass("fa-unlock-alt");
		}

		var canvas = drop.find("canvas")[0];
		canvas.height = 1500;
		canvas.width = 2000;

		var drawFlag = false;
		var color = "black";
		var prevX, prevY;

		var ctx = canvas.getContext("2d");
		var oldGCO = ctx.globalCompositeOperation;

		if (oldDrawBuffer && oldDrawBuffer.length > 0) {
			for (var i = 0; i < oldDrawBuffer.length; i++) {
				var drawObj = oldDrawBuffer[i];
				if (drawObj["itd"] == "rect") {
					ctx.beginPath();
					var color = drawObj["color"];
					if (color == "alpha") {
						ctx.globalCompositeOperation = "destination-out";
						ctx.fillStyle = "rgba(0,0,0,1)";
						ctx.fillRect(drawObj["fx"], drawObj["fy"], 10, 10);
					} else {
						ctx.fillStyle = color;
						ctx.fillRect(drawObj["fx"], drawObj["fy"], 2, 2);
					}
					ctx.closePath();
					ctx.globalCompositeOperation = oldGCO;
				} else if (drawObj["itd"] == "line") {
					ctx.beginPath();
					ctx.moveTo(drawObj["fx"], drawObj["fy"]);
					ctx.lineTo(drawObj["tx"], drawObj["ty"]);
					var color = drawObj["color"];
					if (color == "alpha") {
						ctx.globalCompositeOperation = "destination-out";
						ctx.strokeStyle = "rgba(0,0,0,1)";
						ctx.lineWidth = 10;
					} else {
						ctx.strokeStyle = color;
						ctx.lineWidth = 2;
					}
					ctx.stroke();
					ctx.closePath();
					ctx.globalCompositeOperation = oldGCO;
				}
			}
		}

		var drawBuffer = [];
		$(canvas).on("mousedown", function (e) {
			if (drop.find("canvas").attr("drawable") == "true") {
				drawFlag = true;
				prevX = (e.offsetX || e.pageX - $(e.target).offset().left);
				prevY = (e.offsetY || e.pageY - $(e.target).offset().top);
				ctx.beginPath();
				if (color == "alpha") {
					ctx.globalCompositeOperation = "destination-out";
					ctx.fillStyle = "rgba(0,0,0,1)";
					ctx.fillRect(prevX, prevY, 10, 10);
				} else {
					ctx.fillStyle = color;
					ctx.fillRect(prevX, prevY, 2, 2);
				}


				ctx.closePath();
				var drawObj = { "itd": "rect", "color": color, "fx": prevX, "fy": prevY };
				sendDrawSomething(itemId, userId, drawObj);
				drawBuffer.push(drawObj);
			}
		});

		$(canvas).on("mouseup mouseout", function (e) {
			drawFlag = false;
			if (drawBuffer.length > 0)
				sendEndDraw(itemId, drawBuffer);
			drawBuffer = [];
			ctx.globalCompositeOperation = oldGCO;
		});

		$(canvas).on("mousemove", function (e) {
			if (drawFlag) {
				currX = (e.offsetX || e.pageX - $(e.target).offset().left);
				currY = (e.offsetY || e.pageY - $(e.target).offset().top);
				ctx.beginPath();
				ctx.moveTo(currX, currY);
				ctx.lineTo(prevX, prevY);

				if (color == "alpha") {
					ctx.globalCompositeOperation = "destination-out";
					ctx.strokeStyle = "rgba(0,0,0,1)";
					ctx.lineWidth = 10;
				} else {
					ctx.strokeStyle = color;
					ctx.lineWidth = 2;
				}

				ctx.stroke();
				ctx.closePath();
				var drawObj = { "itd": "line", "color": color, "fx": currX, "fy": currY, "tx": prevX, "ty": prevY };
				sendDrawSomething(itemId, userId, drawObj);
				drawBuffer.push(drawObj);
				prevX = currX;
				prevY = currY;

			}
		});

		drop.find(".colorToPickDiv").click(function () {
			color = $(this).attr("color");
		});

		if (userId == ownSocketId || roomImIn["moderator"] == ownSocketId || username == itemUsername) {
			drop.find(".colorToPickContainer").show();
			drop.find(".saveFrameBtn").show();
			drop.find("canvas").css({ "cursor": "crosshair" });
			drop.find("canvas").attr("drawable", "true");

			drop.find(".lockUnlockCanvas").show();
			drop.find(".lockUnlockCanvas").click(function () {
				if ($(this).find("i").hasClass("fa-lock")) {
					$(this).find("i").removeClass("fa-lock");
					$(this).find("i").addClass("fa-unlock-alt");
					sendLockUnLockCanvas(itemId, "true");
				} else {
					$(this).find("i").addClass("fa-lock");
					$(this).find("i").removeClass("fa-unlock-alt");
					sendLockUnLockCanvas(itemId, "false");
				}
			});

			drop.find(".makeTransparent").show();
			drop.find(".makeTransparent").click(function () {
				if (drop.hasClass("transparent")) {
					sendMakeTransparent(itemId, false);
				} else {
					sendMakeTransparent(itemId, true);
				}
			});

			drop.resizable({
				resize: function (event, ui) {
					$("#praesiDragOverlay").show();
					drop.css("padding-bottom", "0px");
					drop.find(".innerContent").css({ "height": (ui.size.height - 27) + "px", "width": ui.size.width + "px" });
					sendChangeElementSize(itemId, ui.size.width, ui.size.height);
				},
				stop: function (event, ui) {
					$("#praesiDragOverlay").hide();
				}
			});

			drop.find(".saveFrameBtn").click(function () {
				var _this = this;
				$(_this).hide();
				var width = drop.find(".innerContent").width();
				var height = drop.find(".innerContent").height();
				var copyCanvas = document.createElement('canvas');
				copyCanvas.width = width;
				copyCanvas.height = height;

				var destCtx = copyCanvas.getContext('2d');
				destCtx.drawImage(canvas, 0, 0);

				var url = copyCanvas.toDataURL();
				writeToChat("Server", "Image is uploading...");
				$.ajax({
					type: 'POST',
					url: document.URL.substr(0, document.URL.lastIndexOf('/')) + '/upload',
					data: {
						'imagedata': url,
						'room': roomImIn["roomName"],
						'name': "canvas",
						'userId': ownSocketId,
						'uploadType': "singleFileUpload"
					},
					success: function (msg) {
						$(_this).show();
						writeToChat("Server", "Image saved! (Check the Filetable on the right!)");
						if (!$("#showFiles").hasClass("alert-danger")) {
							$("#showFiles").click();
						}
					},
					error: function (err) {
						$(_this).show();
						writeToChat("Error", "Failed to upload frame: " + JSON.stringify(err));
					}
				});
			});
		} else {

		}
		drop.css({ "background": usercolor, "color": invertColor(usercolor) });
	}

	if (drop != "") {
		drop.addClass("slideItem" + praesislide);
		drop.addClass("praesi" + praesiname);
		drop.addClass("UserPItem");
		drop.attr("droped", "true");
		drop.attr("itemUsername", itemUsername);
		drop.attr("id", itemId);
		drop.attr("userId", userId);
		drop.attr("title", itemUsername);
		posY = posY > 100 ? 50 : posY;
		posX = posX > 110 ? 50 : posX;
		drop.css({ "position": "absolute", "top": posY + "%", "left": posX + "%", "z-index": "2" });
		drop.appendTo($(currentTab));

		if (transparent) {
			drop.find(".innerContent").addClass("transparent");
			drop.find("canvas").addClass("transparent");
			drop.addClass("transparent");
		}

		if (userId == ownSocketId || roomImIn["moderator"] == ownSocketId || username == itemUsername) {
			drop.css({ "cursor": "move" });
			drop.find(".innerContent").css({ "cursor": "default" });

			drop.find(".trash").show();

			var dragOption = {
				//containment: "parent",
				start: function () {
					$("#praesiDragOverlay").show();
				},
				stop: function (event, ui) {
					$("#praesiDragOverlay").hide();
					var pos = getItemPosiInPercent(event, ui.position.left, ui.position.top);
					var x = pos.x;
					var y = pos.y;
					sendFixPItemPosition(x, y, $(this).attr("id"), $(this).attr("userId"));
				},
				drag: function (event, ui) {
					var pos = getItemPosiInPercent(event, ui.position.left, ui.position.top);
					var x = pos.x;
					var y = pos.y;
					sendChangeUserPItemPosition(x, y, $(this).attr("id"), $(this).attr("userId"));
				},
				cancel: 'canvas,input,textarea,button,select,option,.innerContent'
			}
			if (item == "camera") {
				dragOption["handle"] = "p";
			}
			drop.draggable(dragOption);

			if (drop.find(".trash").length >= 1) {
				drop.find(".trash").click(function () {
					sendRemoveUserPItem(itemId, $(this).attr("userId"));
				});
			} else {
				drop.dblclick(function (event) {
					if (!$(event.target).hasClass("innerContent") && !$(event.target).parents().hasClass("innerContent")) {
						sendRemoveUserPItem(itemId, $(this).attr("userId"));
					}
				});
			}

			if (userId == ownSocketId && item == 'textfield') {
				drop.find("textarea").focus();
			}
		}
	}
}

function getItemPosiInPercent(event, posX, posY) {
	var mainPraesi = $(currentTab);
	var mpWidth = mainPraesi.width();
	var mpHeight = mainPraesi.height();
	var offset = mainPraesi.offset();
	var x = posX || (event.pageX - offset.left);
	var y = posY || (event.pageY - offset.top);

	var xp = Math.round((x / (mpWidth / 100)) * 100) / 100;
	var yp = Math.round((y / (mpHeight / 100)) * 100) / 100;
	yp = yp > 100 ? 50 : yp;
	xp = xp > 110 ? 50 : xp;
	return { x: xp, y: yp };
}

function getRoomLink() {
	return window.location.href.split("/?")[0] + "?room=" + roomImIn["roomName"].split("###")[0];
}

function setUserColor(id, color) {
	$("#" + id).find(".colorPickerDiv").css({ "background": color });

	$.each($(".UserPItem[userid=" + id + "]"), function () {
		if ($(this).find("textarea").length > 0) {
			$(this).css({ "background": color, "color": invertColor(color) });
		}
		else if ($(this).find("canvas").length > 0) {
			$(this).css({ "background": color, "color": invertColor(color) });
		}
		else
			$(this).css({ "color": color });
	});

	if (roomImIn && id == roomImIn["moderator"]) {
		$(".praesiCursor").css({ "color": color });
	}
	$("#handsUpAlertDivContainer").find('.userCard-' + id).css("background", color);
	if (id == ownSocketId) {
		ownColor = color;
		try {
			var pad = $("#etherpadIframe")[0].contentWindow.pad; //Update Etherpad colors as well
			pad.notifyChangeColor(ownColor);
			pad.myUserInfo.globalUserColor = ownColor;
		} catch (e) {
			console.log("Could not access Etherpad IFRAME to set colors!")
		}
	}
}

var canvasCTXs = {};
function drawSomething(content) {
	if (typeof (canvasCTXs[content.itemId]) == "undefined") {
		var canvas = $("#" + content.itemId).find("canvas")[0];
		canvasCTXs[content.userId + "-" + content.itemId] = canvas.getContext("2d");
	}
	var ctx = canvasCTXs[content.userId + "-" + content.itemId];
	var ttd = content.thingToDraw;
	var oldGCO = ctx.globalCompositeOperation;
	if (ttd["itd"] == "line") {
		ctx.beginPath();
		ctx.moveTo(ttd.fx, ttd.fy);
		ctx.lineTo(ttd.tx, ttd.ty);
		color = ttd.color;
		if (color == "alpha") {
			ctx.globalCompositeOperation = "destination-out";
			ctx.strokeStyle = "rgba(0,0,0,1)";
			ctx.lineWidth = 10;
		} else {
			ctx.strokeStyle = color;
			ctx.lineWidth = 2;
		}
		ctx.stroke();
		ctx.closePath();
	} else if (ttd["itd"] == "rect") {
		ctx.beginPath();
		color = ttd.color;
		if (color == "alpha") {
			ctx.globalCompositeOperation = "destination-out";
			ctx.fillStyle = "rgba(0,0,0,1)";
			ctx.fillRect(ttd.fx, ttd.fy, 10, 10);
		} else {
			ctx.fillStyle = color;
			ctx.fillRect(ttd.fx, ttd.fy, 2, 2);
		}

		ctx.closePath();
	}
	ctx.globalCompositeOperation = oldGCO;
}

function changeUserPItemPosition(content) {
	var userId = content.userId;
	var x = content.posX;
	var y = content.posY;
	var itemId = content.itemId;

	$("#" + itemId).css({ "top": y + "%", "left": x + "%" });
}

function setGetMicToUser(data) {
	var disableHandUp = data["disableHandUp"];
	var userId = data["userid"];
	var mic = data["mic"];
	console.log(data);
	if (disableHandUp === true) {
		if (userId == ownSocketId) {
			$("#handsUpBtn").hide();
		}
	} else {
		if (userId == ownSocketId) {
			$("#handsUpBtn").show();
		}
	}

	var micElement = $($(".user-" + userId).find(".micToSpeak")[0])
	if (mic == "mic") {
		if (disableHandUp + "".indexOf("subHandMic") === -1) {
			$(".userCard-" + userId).find(".mainHandIcon").removeClass("fa-hand-o-up").addClass("fa-volume-up");
			if (ownSocketId != roomImIn["moderator"] && userId != ownSocketId) {
				$(".userCard-" + userId).find(".additionalHand").show();
			}
		} else {
			if (disableHandUp) {
				var handSplit = disableHandUp + "".split("###");
				if (handSplit.length == 2) { //Change icon to speak
					var subUserId = handSplit[1];
					$(".userCard-" + subUserId).find('.userSubCard-' + userId).find(".fa-hand-o-up").removeClass("fa-hand-o-up").addClass("fa-volume-up");
				}
			}
		}
		if (userId == ownSocketId) {
			$(".user-" + userId).find(".micToSpeak").css({ "cursor": "pointer" });
		}
		micElement.css("color", "rgb(3, 169, 244)");
		micElement.attr("mic", "true");
		refreshMuteUnmuteAll();
	} else {
		if (userId == ownSocketId) {
			$(".user-" + userId).find(".micToSpeak").css({ "cursor": "auto" });
		}
		micElement.css("color", "rgb(142, 142, 142)");
		micElement.attr("mic", "false");
		refreshMuteUnmuteAll();
	}
}

function refreshUserItems() {
	removeAllUserPitems();
	if (currentPraesiName && allLoadedPraesis[currentPraesiName] && currentTab == "#praesiDiv") { //We are on the loaded praesi tab
		refreshUserPIconsOnScreen(currentPraesiName);
	} else {
		if (userPItems) {
			function rpItems() {
				if ($(".praesiMainContent:visible").length >= 1) {
					for (var i = 0; i < userPItems.length; i++) {
						if (!userPItems[i]["praesiname"]) {
							addUserPItem(userPItems[i]);
						}
					}
				} else {
					setTimeout(rpItems, 500);
				}
			}
			rpItems();
		}
	}
}


//Set Moderator //////////////////////////////////////////////////////////////////////////////
function setModerator(id) {
	var iWasTheOldMod = false;
	$("#praesiGround").css("transform", "scale(1,1) translateX(0%) translateY(0%)"); //reset zoom
	$("#moderatorPlaceholder").remove();
	$.each($("#moderatorDiv").find(".userdiv"), function () {
		var socketId = $(this).attr("id");
		if (socketId == ownSocketId && id != ownSocketId) {
			iWasTheOldMod = true;
		}
		var userLabel = $("#" + socketId);
		$("#userPanel").append($(this));
		if ($(this).find("video").length > 0) {
			$(this).find("video").get(0).play();
		}
		$(this).find(".micToSpeak").css("color", "silver");
	});
	if (id == "0") {
		var placeholder = $('<div id="moderatorPlaceholder" style="margin-bottom:5px; text-align: center; cursor:pointer;" class="">' +
			'<div style="height: 55px; padding: 15px;">' +
			'Moderation <i class="fa fa-refresh"></i>' +
			'</div>' +
			'</div>');
		placeholder.click(function () {
			sendModeratorId(ownSocketId);
		});
		$("#moderatorDiv").append(placeholder);
	} else {
		$("#moderatorDiv").append($(".user-" + id));
		if ($(".user-" + id).find("video").length > 0) {
			$(".user-" + id).find("video").get(0).play();
		}

		$(".praesiCursor").css({ "color": $(".user-" + id + " .colorPickerDiv").css("background-color") });
	}
	refreshMuteUnmuteAll();

	if (id == ownSocketId) {
		$(".nav.nav-tabs").find("a").css({ "cursor": "pointer" });
		$(".moderatorTools").show();
		$("#userPanel").find(".micToSpeak").css("cursor", "pointer");
		$("#praesiToolbar").css({ "height": "60px" });

		refreshUserItems();

		$("#handsUpBtn").hide();

		$('.mainTab[tabtarget="' + currentTab + '"]').addClass("alert-danger");
	} else {
		$(".nav.nav-tabs").find("a").css({ "cursor": "not-allowed" });
		$(".modOnly").hide();
		$(".moderatorTools").hide();
		$("#praesiToolbar").css({ "height": "0px" });
		$("#userPanel").find(".micToSpeak").css("cursor", "auto");
		if ($(".user-" + ownSocketId).find(".micToSpeak").attr("mic") == "true") {
			$(".user-" + ownSocketId).find(".micToSpeak").css("cursor", "pointer");
		}

		if (iWasTheOldMod) {
			refreshUserItems();

			if (screen_stream) {
				myMCU.unpublishStream(screen_stream)
				screen_publishing = false;
				$("#startScreenShareBtn").css("position", "relative");
				$("#startScreenShareBtn").text("start screenshare!");
			}
		}

		$("#handsUpBtn").show();
	}
	$("#moderatorDiv").find(".micToSpeak").css("color", "rgb(3, 169, 244)");

	if (screen_publishing && screen_stream && ownSocketId != id) { //Stop screenshare on mod switch
		screen_stream.close();
		screen_publishing = false;
	}

	$("#youtubeWaitContent").show();
	$("#ytapiplayer").empty();
	showHideVideoOptions()
}

var silence = false;
function setStatus(id, status) {
	if ($(".user-" + id).find(".statusPool").length > 0) {
		var pool = $($(".user-" + id).find(".statusPool")[0]);
		var icon = $('<i style="font-size: 1.1em; padding: 2px; float: right;" class=""></i>');
		if (status == "muted") {
			icon.addClass("fa fa-microphone-slash");
			pool.append(icon);
		} else if (status == "not-muted") {
			pool.find(".fa-microphone-slash").remove();
		} else if (status == "silence") {
			icon.addClass("mdi-av-volume-off");
			icon.addClass("pictureLayer");
			$(".user-" + id).find(".userIcon").css("opacity", "0.3");
			$(".user-" + id).find(".userIconWrapper").append(icon);
			if (id == ownSocketId) {
				silence = true;
			}
		} else if (status == "not-silence") {
			pool.find(".mdi-av-volume-off").remove();
			$(".user-" + id).find(".pictureLayer").remove();
			$(".user-" + id).find(".userIcon").css("opacity", "1.0");
			if (id == ownSocketId) {
				silence = false;
			}
		} else if (status == "horn") {
			if (pool.find(".fa-bullhorn").length == 0) {
				icon.addClass("fa fa-bullhorn");
				pool.append(icon);
			}
		} else if (status == "not-horn") {
			pool.find(".fa-bullhorn").remove();
		} else if (status == "thumbup") {
			$(".user-" + id).find(".thumbIndicator").css({ "background": "rgba(0, 255, 0, 0.27)" });
			icon.addClass("fa fa-thumbs-o-up");
			pool.append(icon);
			updateThumbCtn();
		} else if (status == "not-thumbup") {
			$(".user-" + id).find(".thumbIndicator").css({ "background": "#00ff0000" });
			pool.find(".fa-thumbs-o-up").remove();
			updateThumbCtn();
		} else if (status == "thumbdown") {
			$(".user-" + id).find(".thumbIndicator").css({ "background": "rgba(244, 67, 54, 0.27)" });
			icon.addClass("fa fa-thumbs-o-down");
			pool.append(icon);
			updateThumbCtn();
		} else if (status == "not-thumbdown") {
			$(".user-" + id).find(".thumbIndicator").css({ "background": "#00ff0000" });

			pool.find(".fa-thumbs-o-down").remove();
			updateThumbCtn();
		} else if (status == "handup") {
			icon.addClass("fa fa-hand-o-up");
			addHandUpCard(id);
			pool.append(icon);
		} else if (status == "not-handup") {
			pool.find(".fa-hand-o-up").remove();
			if ($("#handsUpAlertDivContainer").find('.userCard-' + id).length >= 1) {
				$("#handsUpAlertDivContainer").find('.userCard-' + id).animate({
					left: "-50px"
				}, 100, function () {
					$(this).remove();
				});
				if (id == ownSocketId) {
					sendSetGetMicToUser(id, "not-mic", false);
				}
			}
		} else if (status == "coffee") {
			icon.addClass("fa fa-coffee");
			pool.append(icon);
		} else if (status == "not-coffee") {
			pool.find(".fa-coffee").remove();
		} else if (status == "not-onscreen") {
			if (pool.find(".fa-eye-slash").length == 0) {
				icon.addClass("fa fa-eye-slash");
				pool.append(icon);
			}
		} else if (status == "onscreen") {
			pool.find(".fa-eye-slash").remove();
		} else if (status == "applause") {
			icon.addClass("applauseIcon");
			icon.css({ "padding": "0px", "position": "relative", "top": "-1px", "left": "-2px", "height": "5px" });
			icon.html('<i style="color:gray;" class="blink fa fa-sign-language" aria-hidden="true"></i>');
			pool.append(icon);
		} else if (status == "not-applause") {
			pool.find(".applauseIcon").remove();
		}
	}
	refreshMuteUnmuteAll();
}

setInterval(function () {
	refreshMuteUnmuteAll();
}, 1000)

function addSecondHandUp(content) {
	var senderId = content["senderId"];
	var resiverId = content["resiverUserId"];
	var trueFalse = content["trueFalse"];
	console.log(content);
	if ($("#handsUpAlertDivContainer").find('.userCard-' + resiverId).length >= 1) {
		if ($("#handsUpAlertDivContainer").find('.userCard-' + resiverId).find(".userSubCard-" + senderId).length == 0 && trueFalse == true) {
			var name = getUserNameFromId(senderId);
			var color = getUserColor(senderId);
			var subCard = $('<div senderId="' + senderId + '" style="background:' + color + ';" class="userSubCard-' + senderId + ' subHandsUpAlertDiv">' +
				'<div class="userCardNameField"><i class="fa fa-hand-o-up"></i> ' + name + '</div>' +
				'<div class="moderatorTools" style="height:20px; cursor: pointer;"><i style="padding-right: 8px; cursor: pointer;" class="hoverShadow fa fa-check"></i> <i class="hoverShadow fa fa-times"></i></div>' +
				'</div>')
			$("#handsUpAlertDivContainer").find('.userCard-' + resiverId).append(subCard);

			subCard.find(".fa-times").click(function () {
				sendSetGetMicToUser(senderId, "not-mic", "subHandMic"); //Subhandmic is not touching a handraise
				sendSecondHandUp(senderId, resiverId, false)
			});
			subCard.find(".fa-check").click(function () {
				$(this).hide();
				sendSetGetMicToUser(senderId, "mic", "subHandMic###" + resiverId);
			});

			if (ownSocketId == roomImIn["moderator"]) {
				subCard.find(".moderatorTools").show();
			}

		} else {
			$("#handsUpAlertDivContainer").find('.userCard-' + resiverId).find(".userSubCard-" + senderId).remove();
		}
	}
}

function addHandUpCard(id) {
	if ($("#handsUpAlertDivContainer").find('.userCard-' + id).length == 0) {
		var name = getUserNameFromId(id);
		var color = getUserColor(id);
		var card = $('<div style="background:' + color + ';" class="userCard-' + id + ' handsUpAlertDiv">' +
			'<div class="userCardNameField">' + name + '</div>' +
			'<div style="height:28px; font-size: 1.6em; color: rgb(230, 230, 230);"><i class="mainHandIcon fa fa-hand-o-up"></i></div>' +
			'<div class="moderatorTools" style="height:20px; cursor: pointer;"><i style="padding-right: 8px; cursor: pointer;" class="hoverShadow fa fa-check"></i> <i class="hoverShadow fa fa-times"></i></div>' +
			'<div title="Raise your hand in the context of this person" style="display:none; position:absolute; right:3px; top:27px; color: #808080d4; cursor: pointer;" class="additionalHand"><i class="fa fa-hand-o-up"></i></div>' +
			'</div>');
		card.find(".fa-times").click(function () {
			sendSetGetMicToUser(id, "not-mic", false);
			sendPutRemoteHandDown(id);

			$.each(card.find(".subHandsUpAlertDiv"), function () { //mute all subhand users
				var senderId = $(this).attr("senderId");
				sendSetGetMicToUser(senderId, "not-mic", "subHandMic");
			});
		});
		card.find(".fa-check").click(function () {
			$(this).hide();
			sendSetGetMicToUser(id, "mic", false);
		});
		card.find(".additionalHand").click(function () {
			var le = card.find('.userSubCard-' + ownSocketId).length;
			if (le >= 1)
				sendSecondHandUp(ownSocketId, id, false);
			else
				sendSecondHandUp(ownSocketId, id, true);
		});

		$("#handsUpAlertDivContainer").append(card);
		if (ownSocketId == roomImIn["moderator"]) {
			card.find(".moderatorTools").show();
		}
		card.addClass("goLeft");
		card.animate({
			left: "0px"
		}, 100, function () {
			card.effect("bounce", { "direction": "left", "times": 1 }, 250);
		});
	}
}

function updateThumbCtn() {
	var peerCnt = $("#leftContainer").find(".userdiv").length;
	var thumUpCnt = $("#leftContainer").find(".userdiv").find(".fa-thumbs-o-up").length;
	var thumDownCnt = $("#leftContainer").find(".userdiv").find(".fa-thumbs-o-down").length;
	var userCount = $("#userPanel").find(".userdiv").length;
	var thumUpCntuser = $("#userPanel").find(".userdiv").find(".fa-thumbs-o-up").length;
	//var ptu = thumUpCnt/(peerCnt/100);
	var clientu = thumUpCntuser / (userCount / 100);
	//var ptd = thumDownCnt/(peerCnt/100);
	$("#tupText").text(thumUpCnt);
	$("#tdownText").text(thumDownCnt);
	if (clientu == 100) {
		var elem = $("#userControls");

		$({ deg: 0 }).animate({ deg: 360 }, {
			duration: 500,
			step: function (now) {
				elem.css({
					transform: "rotate(" + now + "deg)"
				});
			}
		});
	}
}

function updateUserNameText(id, name) {
	name = name.split("_").join(" ");
	name = name.split("-").join(" ");
	var fontSize = 25;
	if (name.length > 4) {
		fontSize = fontSize - (name.length - 4)
	}
	fontSize = fontSize < 10 ? 10 : fontSize;
	$("#" + id).find(".usernameText").html('<div class="usernameTextContent" style="font-size: ' + fontSize + 'px; padding-left:5px; overflow: hidden; position: absolute; top: 18px;">' + name + '</div>');
	if ($("#" + id).find(".usernameText").is(":visible")) {
		var top = (60 - $("#" + id).find(".usernameTextContent").height()) / 2;
		top = top < 0 ? 0 : top;
		$("#" + id).find(".usernameTextContent").css({ "top": top + "px" });
	} else {
		setTimeout(function () { updateUserNameText(id, name) }, 100);
	}
}

function addUserToPanel(id, username) {
	if ($("#" + id).length > 0) {
		console.error("user already on the panel!");
		return;
	}
	var newUser = $('<div id="' + id + '" class="userdiv user-' + id + ' panel panel-default">' +
		'<table style="width:100%;">' +
		'<tr>' +
		'<td style="width: 10px;">' +
		'<div class="colorPickerDiv"><input class="colorPicker" type="color" name="favcolor" value="#ff0000"></div>' +
		'</td>' +
		'<td class="thumbIndicator userIconWrapper" style="position:relative; width: 50px;">' +
		'<img class="userIcon img-thumbnail" style="border: 1px solid rgba(74, 73, 73, 0.61); padding: 0px; max-width:50px; max-height:50px;" src="./img/dummypic.jpg" alt="icon">' +
		'</td>' +
		'<td class="thumbIndicator" style="position:relative; overflow: hidden;">' +
		'<div class="username" style="display:none">' + username + '</div>' +
		'<div class="usernameText" title="' + username + '">' + username + '</div>' +
		'<td style="width:2px;"><div style="border-left:1px solid white; height: 50px; border-right:1px solid #BABABA; width:2px;"></div></td>' +
		'<td class="UserRightTD" title="No audiostream so far!" style="width:65px; background:rgba(244, 3, 3, 0.26)">' +
		'<div>' +
		'<div class="sTop" style="font-size: 1.1em; height:38px; text-align: right; padding-right: 5px; padding-top: 4px;">' +
		'<table style="float: right;"><tr>' +
		'<td><i style="cursor:pointer; display:none;" class="changePlace moderatorTools fa fa-refresh"></i></td>' +
		'<td><div style="width:25px; overflow:hidden;"><i style="color: rgb(142, 142, 142); margin-right:10px; padding-left: 8px;" class="userVolume fa fa-volume-off"></i><div></td>' +
		'<td><i mic="false" style="color:rgb(142, 142, 142); padding-left: 3px;" class="micToSpeak fa fa-microphone"></i></td>' +
		'</tr></table>' +
		'</div>' +
		'<div class="statusPool" style="height:20px; padding-right: 4px;">' +
		'</div>' +
		'</div>' +
		'</td>' +
		'</tr>' +
		'</table>' +
		'<div style="position:relative;" class="videoPlaceholder">' +
		'<div style="position:relative; z-index:1100; max-width:310px;" class="videoContainer">' +
		'<div style="display:none; position:absolute; z-index:11; cursor:pointer; bottom: 3px; right: 4px; color:white;" class="webcamfullscreen"><i class="fa fa-expand"></i></div>' +
		'<div title="pop-out/in video" style="display:none; position:absolute; z-index:11; cursor:pointer; bottom: 3px; left: 4px; color:white;" class="popoutVideoBtn"><i class="fa fa-object-ungroup"></i></div>' +
		'</div>' +
		'</div>' +
		'</div>');
	newUser.find(".changePlace").click(function () {
		if (id == ownSocketId) {
			sendModeratorId("0");
			newUser.find(".micToSpeak").css({ "cursor": "pointer" });
		} else {
			sendModeratorId(id);

		}
	});
	newUser.find(".micToSpeak").click(function () {
		if ($(this).attr("mic") == "true") {
			sendSetGetMicToUser(id, "not-mic");
		} else {
			sendSetGetMicToUser(id, "mic");
		}
	});
	newUser.find(".colorPicker").on("change", function () {
		sendSetUserColor($(this).val());
		setLocalStorage("color", $(this).val());
	});
	newUser.find(".colorPickerDiv").css({ "background": newUser.find(".colorPicker").val() });

	if (id == ownSocketId) {
		$(newUser).find(".userIcon").css("cursor", "pointer");
		$(newUser).find(".userIcon").click(function () {
			$('#userPicUploadModal').modal('show');
		});
	} else {
		newUser.find(".colorPicker").hide();
	}

	newUser.find(".webcamfullscreen").click(function () {
		var vidId;
		if ($(this).parents(".videoContainer").find("video").length) {
			vidId = $(this).parents(".videoContainer").find("video").attr("id");
		} else {
			vidId = $(this).parents(".videoContainer").find("canvas").attr("id");
		}

		var elem = document.getElementById(vidId);
		if (elem.requestFullscreen) {
			elem.requestFullscreen();
		} else if (elem.mozRequestFullScreen) {
			elem.mozRequestFullScreen();
		} else if (elem.webkitRequestFullscreen) {
			elem.webkitRequestFullscreen();
		}
	});
	var videoContainer = newUser.find(".videoContainer");
	newUser.find(".popoutVideoBtn").click(function () {
		var isPopedOut = $(this).attr("popedOut") == "true" ? true : false;

		if (isPopedOut) {
			videoContainer.css({ "position": "relative", "top": "0px", "left": "0px", "cursor": "default" });
			videoContainer.appendTo(newUser.find(".videoPlaceholder"));
			videoContainer.find(".direktVideoContainer").css({ "width": "100%" });
			videoContainer.draggable({ disabled: true });
		} else {
			videoContainer.find(".direktVideoContainer").css({ "width": "310px" });
			videoContainer.appendTo("body");
			videoContainer.css({ "position": "absolute", "top": "100px", "left": "100px", "cursor": "move" });
			videoContainer.draggable({ disabled: false });
		}
		if (videoContainer.find("video").length) {
			videoContainer.find("video").get(0).play();
		}
		$(this).attr("popedOut", !isPopedOut);
	});

	$(".userPanel").append(newUser);
	imgExists("./profilePics/" + username, function (ret) {
		if (ret) {
			newUser.find(".userIcon").attr("src", "./profilePics/" + username);
		}
	});

	$("#userCnt").text($("#leftContainer").find(".userdiv").length);
	if (roomImIn.moderator == ownSocketId) {
		newUser.find(".changePlace").show();
	}
}

function loadPraesis(praesis) {
	allLoadedPraesis = praesis;
	$("#praesiTable tbody").empty();
	setTimeout(function () {
		$("#praesiUpInfo").empty();
	}, 3000);
	$("#newPraesiTable").show();
	if (JSON.stringify(praesis) == "{}")
		$("#praesiTable tbody").append('<span style="color:gray;">Empty...</span>');


	for (var name in praesis) {
		function addRow(name) {
			var type = 'NA';
			if (allLoadedPraesis[name]["type"] == "pdfPraesi")
				type = '<i title="PDF" class="fa fa-file-pdf-o"></i>';
			else if (allLoadedPraesis[name]["type"] == "revealPraesi")
				type = '<span title="RevealJs">R</span>';

			var slidesText = allLoadedPraesis[name]["slideCtn"] > 0 ? '(Slides: ' + allLoadedPraesis[name]["slideCtn"] + ')' : '';
			var tr = $('<tr>' +
				'<td>' + name + ' ' + slidesText + '</td>' +
				'<td>' + type + '</td>' +
				'<td class="praesiSettingsIconTd">' +
				'<i title="show presentation" class="viewPraesi fa fa-eye"></i>' +
				'</td>' +
				'<td class="praesiSettingsIconTd">' +
				'<i title="delete presentation" class="delPraesi fa fa-trash"></i>' +
				'</td>' +
				'</tr>');


			tr.find(".viewPraesi").parent("td").click(function () {
				$("#showPresentation").click();
				sendLoadSlide(name, 0);
			});
			tr.find(".delPraesi").parent("td").click(function () {
				sendDeletePraesi(name);
			});
			$("#praesiTable tbody").append(tr);
		};
		addRow(name);
	}
}

function showHideVideoOptions(action) { //Stop videosharing with more than accSettings.userCntVideoShareLimit Users
	var userCnt = $("#leftContainer").find(".userdiv").length;
	$("#userCnt").text(userCnt);
	if (userCnt > accSettings.userCntVideoShareLimit && roomImIn["moderator"] != ownSocketId) { //Hide cams if more than accSettings.userCntVideoShareLimit users //no hide for moderator
		$("#videoBtn").hide();
		$("#videoBtn.alert-danger").click(); //Stop active cams
		if ($("#videoBtn").hasClass("alert-danger")) {
			$("#videoBtn").removeClass("alert-danger");
		}
	} else {
		$("#videoBtn").show();
	}
	if (action == "add" && userCnt == accSettings.userCntVideoShareLimit + 1) {
		writeToChat("Info", "Videosharing was disabled for non-moderators. (Disabled for more than " + accSettings.userCntVideoShareLimit + " people)");
	} else if (action == "remove" && userCnt == accSettings.userCntVideoShareLimit) {
		writeToChat("Info", "Videosharing is enabled again. (" + accSettings.userCntVideoShareLimit + " or less people)");
	}
}

function startLocalVideo() {
	if (!isLocalVideoPlaying) {
		writeToChat("Server", "Try to access webcam!");

		var maxRes = accSettings && accSettings["webcamConfig"] && accSettings["webcamConfig"]["maxResolution"] ? accSettings["webcamConfig"]["maxResolution"] : "480p";
		var maxFPS = accSettings && accSettings["webcamConfig"] && accSettings["webcamConfig"]["maxFPS"] ? accSettings["webcamConfig"]["maxFPS"] : 15;

		var maxWidth = 480;
		var maxHeight = 360
		if (maxRes == "1080p") {
			maxWidth = 1280;
			maxHeight = 1080;
		} else if (maxRes == "720p") {
			maxWidth = 1280;
			maxHeight = 720;
		} else if (maxRes == "480p") {
			maxWidth = 640;
			maxHeight = 480;
		}

		var newVidConstrains = {
			frameRate: {
				ideal: maxFPS
			},
			width: {
				max: maxWidth
			},
			height: {
				max: maxHeight
			}
		}

		if (prevVideoInputDevice) {
			newVidConstrains["deviceId"] = { ideal: prevVideoInputDevice }
		}
		navigator.getUserMedia({ audio: false, video: newVidConstrains }, (stream) => {
			localVideoStrm = stream;
			var streamId = stream.id.replace('{', "").replace('}', "")
			localVideoStrm["streamAttributes"] = { socketId: ownSocketId, username: username };
			writeToChat("Publish video stream:" + streamId)
			if ($("#videoBtn").hasClass("alert-danger")) { //Don't start stream when button has been recklicked
				myMCU.publishStreamToRoom(roomImIn["roomName"], localVideoStrm, function (err) {
					if (err) {
						writeToChat("ERROR", "Stream could not be published! Error: " + err);
					} else {
						isLocalVideoPlaying = true;
						writeToChat("Server", "Webcamstream connecting...");
						sendUserStatus("video")

						var videoElement = $('<div id="video' + streamId + '" class="direktVideoContainer socketId' + ownSocketId + '" style="height: 225px; width: 100%; z-index:10;"></div>');
						$("#" + ownSocketId).find(".videoContainer").append(videoElement);
						myMCU.showMediaStream("video" + streamId, stream, 'width:300px; height:225px; position: absolute; top:0px;');
						$("#" + ownSocketId).find(".webcamfullscreen").show();
						$("#" + ownSocketId).find(".popoutVideoBtn").show();
						updateConfGridView();
					};
				});
			}
		}, (err) => {
			writeToChat("ERROR", "Access to webcam rejected or device not available!");
			sendUserStatus("not-video");
			$("#videoBtn").addClass("alert-error");
			if ($("#videoBtn").hasClass("alert-danger")) {
				$("#videoBtn").removeClass("alert-danger");
			}
		})
	}
}

function stopLocalVideo() {
	myMCU.unpublishStream(localVideoStrm);
	isLocalVideoPlaying = false;
	localVideoStrm = null;
	sendUserStatus("not-video");
}

function apendScreenshareStream(stream, streamAttr) {
	console.log("ADD SCREENSHARE!")
	var streamSocketId = streamAttr.streamSocketId;
	if (streamSocketId == ownSocketId) {
		$("#startScreenShareBtn").removeAttr("disabled");
		writeToChat("Server", "Screenshare Connected!");
		$("#startScreenShareBtn").css("position", "initial");
		$("#startScreenShareBtn").text("stop screen share!");
	}
	$(".wait4ScreenShareTxt").hide();
	$("#screenShareStream").show();
	$("#screenShareStream").empty();

	function showTheScreen() {
		if (currentTab == "#screenShare") { //Dont show screenshare on wrong tab
			$("#screenShareStream").empty();
			myMCU.showMediaStream("screenShareStream", stream, "width: 100%; max-height: 80vh;");


			var fullScreenBtn = $('<button style="z-index:10; position:absolute; position: absolute; bottom: 0px; right: 0px;"><i class="fa fa-expand"></i></button>');
			fullScreenBtn.click(function () {
				var video;
				if ($("#screenShareStream video").length) {
					video = $("#screenShareStream video")[0];
				} else {
					video = $("#screenShareStream canvas")[0];
				}

				if (video.requestFullscreen) {
					video.requestFullscreen();
				} else if (video.mozRequestFullScreen) {
					video.mozRequestFullScreen(); // Firefox
				} else if (video.webkitRequestFullscreen) {
					video.webkitRequestFullscreen(); // Chrome and Safari
				}
			});
			$("#screenShareStream").append(fullScreenBtn);
		} else {
			setTimeout(showTheScreen, 1000);
		}
	}
	showTheScreen();
}

function updateConfGridView(leavingConfTab) {

	if (currentTab == "#conf" || leavingConfTab) {
		$.each($(".videoContainer"), function () { //Pop videos back in
			if ($(this).find("video,canvas").length >= 1) {
				$(this).find(".popoutVideoBtn").attr("popedOut", "true")
				$(this).find(".popoutVideoBtn").click();
			}
		})

		$.each($("video,canvas"), function () { //Put the videos back in place
			console.log("IDDD", "#video" + $(this).attr("id"))
			$("#video" + $(this).attr("id")).append($(this))
			$("#video" + $(this).attr("id")).parents(".videoContainer ").show();
			if ($(this).is("video")) {
				this.play();
			}
		});

		$.each($(".direktVideoContainer"), function () {
			if (!$(this).find("video,canvas").length) {
				$(this).remove();
			}
		});
	}

	if (currentTab == "#conf" && !leavingConfTab) {
		var videoCnt = 0;
		$.each($(".videoContainer"), function () {
			if ($(this).find("video,canvas").length >= 1) {
				videoCnt++;
			}
		})
		var lineCnt = Math.round(Math.sqrt(videoCnt));

		$("#confContend").empty();
		if (lineCnt == 0) {
			$("#confContend").html('<div style="z-index:1; position: absolute; top: 0px; left: 0px; text-align: center; width: 100%; color:white;">' +
				'<br><br>' +
				'<h1 style="font-family: "Rock Salt", cursive !important;"><span>Conference Grid</span></h1>' +
				'<i style="font-size: 22em; color: white;" class="fa fa-th"></i>' +
				'<div>Waiting for camera shares...</div>' +
			'</div>');
			$("#confContend").css({ "background": "rgba(255, 255, 255, 0.19)" })
		} else {
			$("#confContend").css({ "background": "rgba(255, 255, 255,0)" })
			for (var i = 0; i < lineCnt; i++) {
				$("#confContend").append('<div class="row confline confline' + (i + 1) + '"></div>')
			}
			let userPerLine = Math.ceil(videoCnt / lineCnt);
			let cucnt = 0;

			$.each($(".videoContainer"), function () {
				if ($(this).find("video,canvas").length >= 1) {
					cucnt++;
					var vidEl = $($(this).find("video,canvas")[0]);
					vidEl.css({ "position": "relative", "height": "100%", "width": "unset" });
					if (cucnt % 2 == 1) {
						vidEl.css({ "float": "right" });
					} else {
						vidEl.css({ "float": "left" });
					}
					var gElm = $('<div style="margin-left: auto; margin-right: auto;" class="col-sm confVideoPlaceholder"></div>')
					gElm.append(vidEl);
					var cLineNr = Math.ceil(cucnt / userPerLine);
					gElm.css({ width: 100 / userPerLine + '%', height: 750 / lineCnt + 'px', float: 'left' });
					$(".confline" + cLineNr).append(gElm)

					$(this).hide();
				}
			})

			var lastLineElsCnt = $("#confContend").find(".confline" + lineCnt).find(".confVideoPlaceholder").length;
			// console.log(lastLineElsCnt, userPerLine)
			if (lastLineElsCnt != userPerLine) {
				var p = (100 / userPerLine) / 2;
				$("#confContend").find(".confline" + lineCnt).find(".confVideoPlaceholder").css({ "left": p + "%", "position": "absolute" })
				$("#confContend").find(".confline" + lineCnt).find(".confVideoPlaceholder").find("video,canvas").css({ "float": "unset" });
			}

			$.each($(".confline"), function () {
				if ($(this).find("video,canvas").length == 1) {
					$(this).find("video,canvas").css({ "float": "unset" });
				}
			})
		}
	}
}

var gPraesi = null;
function loadSlide(name, slideid) {
	$("#praesiPlaceHolder").hide();
	if (allLoadedPraesis[name]["type"] == "revealPraesi") {
		if (currentPraesiName != name || typeof (revealObject) == "undefined") {
			var praesiUrl = './praesis/' + roomImIn["roomName"].split("###")[0] + '/' + name + '/' + allLoadedPraesis[name]["indexFile"];
			rPraesi = $('<iframe id="revealIFrame" style="width: 100%; height: 730px;" src="' + praesiUrl + '"></iframe>');
			$("#praesiDiv").empty();
			$("#praesiDiv").append(rPraesi);
			rPraesi.on("load", function () {
				revealObject = document.getElementById('revealIFrame').contentWindow.Reveal;

				$(rPraesi.contents()).keyup(function (event) {
					if ((event.which != 80 || roomImIn["moderator"] == ownSocketId) && event.which != 8) {
						if (event.which == 39 || event.which == 32) {
							praesiNext();
						} else if (event.which == 37) {
							praesiBack();
						} else {
							sendRevealSlideKey(event.which);
						}
						event.preventDefault();
					}
				});

				revealObject.configure({ controls: false, keyboard: false });
				revealObject.slide(slideid);

				var currentSlide = slideid + 1;
				var slidesArr = revealObject.getSlides();
				$("#slidePageDisplayContent").text(currentSlide + ' / ' + slidesArr.length);

				setTimeout(function () {
					refreshUserPIconsOnScreen(name);
				}, 1000);
			});
		} else {
			revealObject.slide(slideid);

			var currentSlide = slideid + 1;
			var slidesArr = revealObject.getSlides();
			$("#slidePageDisplayContent").text(currentSlide + ' / ' + slidesArr.length);

			refreshUserPIconsOnScreen(name);
		}
	} else if (allLoadedPraesis[name]["type"] == "pdfPraesi") {
		if (currentPraesiName != name || $("#pdfIFrame").length == 0) {
			if ($("#praesiDiv").is(":visible")) {
				$("#praesiDiv").empty();
				var praesiUrl = document.URL.substr(0, document.URL.lastIndexOf('/')) + '/pdfjs/web/viewer.html?file=' + document.URL.substr(0, document.URL.lastIndexOf('/')) + '/praesis/' + roomImIn["roomName"].split("###")[0] + '/' + name + '/' + allLoadedPraesis[name]["filename"];
				pdfPraesi = $('<iframe seamless="seamless" id="pdfIFrame" style="background: black; width: 100%; height: 720px;" src="' + praesiUrl + '"></iframe>');
				$("#praesiDiv").append(pdfPraesi);

				pdfPraesi.on("load", function () {
					var lInt = setInterval(function () {
						if ($(pdfPraesi.contents()).find(".page").length >= 1) {
							clearInterval(lInt);


							$(pdfPraesi.contents()).find("#viewerContainer").appendTo($(pdfPraesi.contents()).find("body"));
							$(pdfPraesi.contents()).find("#viewerContainer").css({ "top": "5px", "overflow": "hidden" })
							$(pdfPraesi.contents()).find(".toolbar").hide();
							$(pdfPraesi.contents()).find("#sidebarContainer").hide();

							$(pdfPraesi.contents()).find("#pageNumber").val(slideid + 1);
							var event = new Event('change');
							$(pdfPraesi.contents()).find("#pageNumber")[0].dispatchEvent(event);

							var event = new Event('change');
							$(pdfPraesi.contents()).find("#scaleSelect").val("page-fit");
							$(pdfPraesi.contents()).find("#scaleSelect")[0].dispatchEvent(event);

							$(pdfPraesi.contents()).keyup(function (event) {
								if ((event.which != 80 || roomImIn["moderator"] == ownSocketId) && event.which != 8) {
									if (event.which == 39 || event.which == 32) {
										praesiNext();
									} else if (event.which == 37) {
										praesiBack();
									}
									event.preventDefault();
								}
							});

							var maxSlides = $(pdfPraesi.contents()).find("#pageNumber").attr("max");
							$("#slidePageDisplayContent").text('1 / ' + maxSlides);

							setTimeout(function () {
								refreshUserPIconsOnScreen(name);
							}, 1000);

						}
					}, 100)
				});
			} else {
				setTimeout(function () {
					loadSlide(name, slideid); //Try to reload when visible
				}, 100)
			}
		} else {
			$($("#pdfIFrame").contents()).find("#pageNumber").val(slideid + 1);
			var event = new Event('change');
			if ($($("#pdfIFrame").contents()).find("#pageNumber")[0]) {
				$($("#pdfIFrame").contents()).find("#pageNumber")[0].dispatchEvent(event);
			}

			var currentSlide = $($("#pdfIFrame").contents()).find("#pageNumber").val();
			var maxSlides = $(pdfPraesi.contents()).find("#pageNumber").attr("max");
			$("#slidePageDisplayContent").text(currentSlide + ' / ' + maxSlides);
			refreshUserPIconsOnScreen(name);
		}
	} else {
		alert("Not supported presentation type!");
	}

	currentPraesiName = name;
	setFullscreenStyle();
}

function refreshUserPIconsOnScreen(name) {
	if (currentPraesiName && allLoadedPraesis[currentPraesiName]) {
		var currentPraesiType = allLoadedPraesis[currentPraesiName]["type"];
		if (currentTab == "#praesiDiv") { //We are on the loaded praesi tab
			removeAllUserPitems();
			if (userPItems) {
				for (var i = 0; i < userPItems.length; i++) {
					if (userPItems[i]["praesiname"] == name && userPItems[i]["praesislide"] == currentPraesiSlide) {
						addUserPItem(userPItems[i]);
					}
				}
			}
		}
	}
}

function removeAllUserPitems() {
	$.each($(".UserPItem"), function () {
		var itemId = $(this).attr("id");
		$(this).remove();
		if (pitemWebcamStreams[itemId]) {
			pitemWebcamStreams[itemId].close();
			delete pitemWebcamStreams[itemId];
		}
	});
}

function getPDFPraesiSlideCount() {
	var fSplit = $($("#pdfIFrame").contents()).find("#numPages").text().split(" ");
	if (fSplit.length == 2) { //Its a onepager
		return fSplit[1];
	} else { //More than one pdf page
		return fSplit[2].split(")")[0];
	}
}

function setFullscreenStyle() {
	if (isFullScreen) {
		$("iframe").addClass("inFullscreen");
		$(".praesiMainContent").addClass("inFullscreen");
	}
}

function resetFullscreenStyle() {
	$("iframe").removeClass("inFullscreen");
	$(".praesiMainContent").removeClass("inFullscreen");
}

function refreshCursorPosition(event) {
	if (roomImIn && roomImIn["moderator"] == ownSocketId) {
		if ($(currentTab).find('.praesiCursor').length == 1) {	//Cursor
			var mainPraesi = $(currentTab);
			var mpWidth = mainPraesi.width();
			var mpHeight = mainPraesi.height();
			var offset = mainPraesi.offset();
			var x = event.pageX - offset.left;
			var y = event.pageY - offset.top;

			var xp = Math.round((x / (mpWidth / 100)) * 100) / 100;
			var yp = Math.round((y / (mpHeight / 100)) * 100) / 100;
			sendCursorPosition({ "x": xp, "y": yp });
		}
	}
}

function praesiBack() {
	currentPraesiSlide--;
	if (currentPraesiSlide < 0)
		currentPraesiSlide = 0;
	if (allLoadedPraesis[currentPraesiName]["type"] == "revealPraesi") {
		sendLoadSlide(allLoadedPraesis[currentPraesiName]["name"], currentPraesiSlide);
	} else {
		sendLoadSlide(allLoadedPraesis[currentPraesiName]["name"], currentPraesiSlide);
	}

	onChangeSlide();
}

function praesiNext() {
	currentPraesiSlide++;
	if (allLoadedPraesis[currentPraesiName]["type"] == "pdfPraesi") {
		$($("#pdfIFrame").contents()).find("#numPages").text().split("of ")
		var l = getPDFPraesiSlideCount() - 1;
		if (currentPraesiSlide > l)
			currentPraesiSlide = l;
		sendLoadSlide(allLoadedPraesis[currentPraesiName]["name"], currentPraesiSlide);
	} else if (allLoadedPraesis[currentPraesiName]["type"] == "revealPraesi") {
		sendLoadSlide(allLoadedPraesis[currentPraesiName]["name"], currentPraesiSlide);
	}

	onChangeSlide();
}

function onChangeSlide() {
	//Do something here
}

function removeUserFromPage(id) {
	$.each($("video,canvas"), function () { //Put the videos back in place from the gridview so we will remove them as well
		console.log("IDDD", "#video" + $(this).attr("id"))
		$("#video" + $(this).attr("id")).append($(this))
		$("#video" + $(this).attr("id")).parents(".videoContainer ").show();
		if ($(this).is("video")) {
			this.play();
		}
	});

	var username = getUserNameFromId(id);
	whiteboard.userLeftWhiteboard(username);



	$(".user-" + id).remove();
	$("#userCnt").text($("#leftContainer").find(".userdiv").length);
	$("#handsUpAlertDivContainer").find('.userCard-' + id).remove();
	$("#handsUpAlertDivContainer").find('.userSubCard-' + id).remove();
	$(".cameraUserPitem" + id).remove();

	updateConfGridView();
}

function changeUserInfos(id, name, color) {
	name = cleanString(name);
	$(".user-" + id).find(".username").text(name);
	updateUserNameText(id, name)
	if (color)
		$("#" + id).find(".colorPickerDiv").css({ "background": color });
}

function renderAllRooms(roomList) {
	allRooms = roomList;
	console.log(roomList);
	$("#roomListContent tbody").empty();

	$("#addNewRoomPanel").show();
	if (JSON.stringify(roomList) == "{}") {
		$("#roomListContent tbody").text("No room on this Server!");
	} else {
		var globalUserCnt = 0;
		var roomesUsedCnt = 0;
		for (var i in roomList) {
			(function () {
				var room = roomList[i];
				if (room["roomName"]) {
					var roomNameSplit = room["roomName"] ? room["roomName"].split("###") : "NA";
					var roomName = roomNameSplit[0];
					var roomNameToShow = roomName.split('_').join(' ');
					var roomLockIcon = "";
					if (room["hasPassword"])
						roomLockIcon = '<i class="fa fa-lock" aria-hidden="true"></i>';

					var roomId = room["_id"];
					var userInRoom = "";
					var usersInRoomCnt = 0;
					for (var k in room["users"]) {
						userInRoom += room["users"][k]["username"] + "\n";
						usersInRoomCnt++;
					}
					globalUserCnt += usersInRoomCnt;
					roomesUsedCnt = usersInRoomCnt ? roomesUsedCnt + 1 : roomesUsedCnt;
					var roomListEntry = $('<tr roomName="' + escape(decodeURIComponent(roomName)).replace(/[^a-zA-Z0-9 ]/g, "") + '" class="roomLaBle">' +
						'<td>' + roomLockIcon + ' ' + roomNameToShow + '</td>' +
						'<td class="clickTr"><span style="color: gray; display:none;" class="clickToEnter">Click to enter</span></td>' +
						'<td style="width:30px"><i style="cursor:pointer; display:none;" class="roomToTrashBtn fa fa-trash-o"></i></td>' +
						'<td style="width:20px" class="usersInRoomTd"><span data-placement="top" title="' + userInRoom + '" class="badge">' + usersInRoomCnt + '</span></td>' +
						'</tr>');

					roomListEntry.mouseenter(function () {
						$(this).find(".roomToTrashBtn").show();
						$(this).find(".clickToEnter").show();
					});
					roomListEntry.mouseleave(function () {
						$(this).find(".roomToTrashBtn").hide();
						$(this).find(".clickToEnter").hide();
					});
					roomListEntry.find(".roomToTrashBtn").click(function (e) {
						e.preventDefault();
						sendDeleteNewRoom(room["roomName"], roomId);
						return false;
					});

					$("#roomListContent tbody").append(roomListEntry);
					roomListEntry.click(function (event) {
						if (!$(event.target).hasClass("roomToTrashBtn, roomPassword")) {
							if (room["hasPassword"]) {
								$(".roomPassword").remove();
								var input = $('<input style="color: black;" class="roomPassword form-control" type="password" placeholder="password">');
								roomListEntry.find(".clickTr").html(input);
								input.focus();
								input.keydown(function (e) {
									if (e.which == 13) {
										var pw = input.val();
										joinRoom(room, pw);
									}
								})
							} else {
								joinRoom(room, "");
							}
						}
					});
				}
			})();
		}
		$("#serverStatsDiv").html('<span style="padding-right:10px;" title="users"> <i class="fa fa-male"></i> ' + globalUserCnt + '</span>  <span title="sessions"><i class="fa fa-users"></i> ' + roomesUsedCnt + '</span>')
	}
	filterRooms();
}

function filterRooms() {
	var searchW = $("#groopRoomSearch").val().toLowerCase();
	document.getElementById('roomListContainer').scrollTop = 0;
	$.each($("#roomListContent").find(".roomLaBle"), function () {
		if ($(this).attr("roomname").toLowerCase().indexOf(searchW) !== -1) {
			$(this).show();
		} else {
			$(this).hide();
		}
	});
}

var joinedRoom = false;
function joinRoom(room, roomPassword) {
	if (!joinedRoom) { //Dont allow to join a room twice
		joinedRoom = true;
		roomImIn = room;
		signaling_socket.emit('join', {
			"roomName": room["roomName"],
			"username": username,
			"color": ownColor,
			"roomPassword": roomPassword
		}, function (err) {
			if (err) {
				alert(err);
			} else {
				showPage("#joinRoomPage");
				loadMCUConnection(room, function () {
					//connectionReadyCallback
					sendConnectionReady();
					renderMainPage(room);
				});
			}
		});
	}
}

function renderMainPage() {
	roomJoinTime = +new Date();
	showPage("#mainPage");

	setModerator(roomImIn["moderator"] || "0");

	history.pushState({}, null, "?room=" + roomImIn["roomName"].split("###")[0]); //Change url to roomlink

	whiteboard.loadWhiteboard("#whiteboardContainer", {
		whiteboardId: roomImIn["roomName"].replace(/[^0-9a-z]/gi, ''),
		username: btoa(username),
		backgroundGridUrl: './img/KtEBa3.png',
		sendFunction: function (content) {
			sendDrawWhiteoard(content);
		}
	});

	$(".whiteboardTool").click(function () {
		$(".whiteboardTool").removeClass("alert-danger");
		$(this).addClass("alert-danger");
		whiteboard.setTool($(this).attr("tool"));
	});

	$("#whiteboardSlider").on("change", function () {
		whiteboard.thickness = 51 - $(this).val();
	});

	$("#whiteboardTrash").click(function () {
		whiteboard.clearWhiteboard();
	});

	$("#whiteboardUndo").click(function () {
		whiteboard.undoWhiteboardClick();
	});

	$("#saveAsImage").click(function () {
		$(this).attr("disabled", "true");
		var _this = this;
		var imgData = whiteboard.getImageDataBase64();
		$.ajax({
			type: 'POST',
			url: document.URL.substr(0, document.URL.lastIndexOf('/')) + '/upload',
			data: {
				'imagedata': imgData,
				'room': roomImIn["roomName"],
				'name': "whiteboard",
				'userId': ownSocketId,
				'uploadType': "singleFileUpload"
			},
			success: function (msg) {
				$(_this).removeAttr("disabled")
				writeToChat("Server", "Image saved! (Check the Filetable on the right!)");
				if (!$("#showFiles").hasClass("alert-danger")) {
					$("#showFiles").click();
				}
			},
			error: function (err) {
				$(_this).show();
				writeToChat("Error", "Failed to upload frame: " + JSON.stringify(err));
			}
		});
	});

	$("#saveAsJson").click(function () {
		$(this).attr("disabled", "true");
		var _this = this;
		var imgData = whiteboard.getImageDataJson();
		$.ajax({
			type: 'POST',
			url: document.URL.substr(0, document.URL.lastIndexOf('/')) + '/upload',
			data: {
				'imagedataJson': imgData,
				'room': roomImIn["roomName"],
				'name': "whiteboard",
				'userId': ownSocketId,
				'uploadType': "singleFileUpload"
			},
			success: function (msg) {
				$(_this).removeAttr("disabled")
				writeToChat("Server", "Image saved! (Check the Filetable on the right!)");
				if (!$("#showFiles").hasClass("alert-danger")) {
					$("#showFiles").click();
				}
			},
			error: function (err) {
				$(_this).show();
				writeToChat("Error", "Failed to upload frame: " + JSON.stringify(err));
			}
		});
	});

	$("#addImgToCanvasBtn").click(function () {
		var modHtml = $('<div>' +
			'<table>' +
			'<tr>' +
			'<td style="padding-top: 20px;"><input id="cradio1" style="position:relative; top:-13px; left:-5px;" checked name="imgUploadType" value="0" type="radio"> </td><td><label for="cradio1">From Accelerator cloud:</label></td><td><select id="imgUploadSelect" style="height:27px; width:300px;" class="imgUploadAccCloudSelect allSingleFilesSelect"></select></td>' +
			'</tr>' +
			'<tr>' +
			'<td style="padding-top: 20px;"><input id="cradio2" style="position:relative; top:-13px; left:-5px;" name="imgUploadType" value="1" type="radio"> </td><td><label for="cradio2">From URL:</label></td><td><input placeholder="Image URL" id="imgUploadURL" disabled style="width:300px;" class="form-control imgUploadUrlInput" type="text"></td>' +
			'</tr>' +
			'</table>' +
			'<br>Info: you can also drag&drop or copy&past images directly to the whiteboard!' +
			'</div>');

		for (var i in allSingleFiles) {
			var filename = allSingleFiles[i]["filename"];
			if (isImageFileName(filename)) {
				modHtml.find(".imgUploadAccCloudSelect").append('<option value="/singlefiles/' + filename + '">' + filename + '</option>');
			}
		}

		modHtml.find('input[type=radio]').click(function () {
			if ($(this).val() == 0) {
				modHtml.find("select").removeAttr("disabled");
				modHtml.find("input[type=text]").attr("disabled", "true");
			} else {
				modHtml.find("input[type=text]").removeAttr("disabled");
				modHtml.find("select").attr("disabled", "true");
			}
		});

		showModal({
			titleHTML: "Add/Draw Image",
			bodyHTML: modHtml,
			okBtnText: "hide",
			saveBtnText: "Add Image to canvas",
			onSaveClick: function (mod) {
				if (processClick()) {
					mod.modal('hide');
				}
			}
		});

		function processClick() {
			var imgUploadURL = modHtml.find("#imgUploadURL").val();
			var imgUploadSelectURL = modHtml.find("#imgUploadSelect").val();
			var option = modHtml.find('input[type=radio]:checked').val();
			console.log(imgUploadURL, imgUploadSelectURL, option)
			var url = null;
			if (option == 0) { //form acc cloud
				if (imgUploadSelectURL && imgUploadSelectURL != "" && isImageFileName(imgUploadSelectURL)) {
					url = document.URL.substr(0, document.URL.lastIndexOf('/')) + '/' + imgUploadSelectURL;
				} else {
					modHtml.find("#imgUploadSelect").css({ "background": "#ff5c5c69" });
					modHtml.find("#imgUploadSelect").attr("title", "Not a vaild image url!");
					return false;
				}
			} else { //form url cloud
				if (imgUploadURL && imgUploadURL != "" && isImageFileName(imgUploadURL)) {
					url = imgUploadURL;
				} else {
					modHtml.find("#imgUploadURL").css({ "border": "1px solid #ff5c5c69" });
					modHtml.find("#imgUploadURL").attr("title", "Not a vaild image url!");
					return false;
				}
			}

			whiteboard.addImgToCanvasByUrl(url);
			return true;
		}
	});

	$.get("./loadwhiteboard", { wid: roomImIn["roomName"].replace(/[^0-9a-z]/gi, '') }).done(function (data) {
		whiteboard.loadData(data)
	});

	$('#whiteboardColorpicker').colorPicker({
		renderCallback: function (elm) {
			whiteboard.drawcolor = elm.val();
		}
	});

	var dragCounter = 0;
	$('#whiteboardContainer').on("dragenter", function (e) {
		e.preventDefault();
		e.stopPropagation();
		dragCounter++;
		whiteboard.dropIndicator.show();
	});

	$('#whiteboardContainer').on("dragleave", function (e) {
		e.preventDefault();
		e.stopPropagation();
		dragCounter--;
		if (dragCounter === 0) {
			whiteboard.dropIndicator.hide();
		}
	});

	$('#whiteboardContainer').on('drop', function (e) {
		if (e.originalEvent.dataTransfer) {
			if (e.originalEvent.dataTransfer.files.length) { //File from harddisc
				e.preventDefault();
				e.stopPropagation();
				/*UPLOAD FILES HERE*/

				var filename = e.originalEvent.dataTransfer.files[0]["name"];
				if (isImageFileName(filename)) {
					var form = $('<form action="#" enctype="multipart/form-data" method="post"></form>');
					var formData = new FormData(form[0]);
					formData.append("file", e.originalEvent.dataTransfer.files[0]);
					formData.append("userId", ownSocketId);
					formData.append("uploadType", "singleFileUpload");
					formData.append("room", roomImIn["roomName"]);
					sendFormData(formData, function (msg) {
						//success callback
						whiteboard.addImgToCanvasByUrl(document.URL.substr(0, document.URL.lastIndexOf('/')) + "/singlefiles/" + filename);
						writeToChat("Success", "Upload success!");
					}, function (err) {
						writeToChat("Error", err);
					}, function (progress) {
						writeToChat("Uploading", progress + '%');
						//Upload progress
					}, function (progress) {
						//Download progress
					});
				} else {
					writeToChat("Error", "File must be an image!");
				}
			} else { //File from other browser
				var fileUrl = e.originalEvent.dataTransfer.getData('URL');
				var imageUrl = e.originalEvent.dataTransfer.getData('text/html');
				var rex = /src="?([^"\s]+)"?\s*/;
				var url = rex.exec(imageUrl);
				if (url && url.length > 1) {
					url = url[1];
				} else {
					url = "";
				}

				isValidImageUrl(fileUrl, function (isImage) {
					if (isImage && isImageFileName(url)) {
						whiteboard.addImgToCanvasByUrl(fileUrl);
					} else {
						isValidImageUrl(url, function (isImage) {
							if (isImage) {
								if (isImageFileName(url)) {
									whiteboard.addImgToCanvasByUrl(url);
								} else {
									var date = (+new Date());
									$.ajax({
										type: 'POST',
										url: document.URL.substr(0, document.URL.lastIndexOf('/')) + '/upload',
										data: {
											'imagedata': url,
											'room': roomImIn["roomName"],
											'name': "whiteboard",
											'date': date,
											'userId': ownSocketId,
											'uploadType': "singleFileUpload"
										},
										success: function (msg) {
											var filename = username + "_whiteboard_" + date + ".png";
											whiteboard.addImgToCanvasByUrl(document.URL.substr(0, document.URL.lastIndexOf('/')) + "/singlefiles/" + filename);
											writeToChat("Server", "Image uploaded");

										},
										error: function (err) {
											writeToChat("Error", "Failed to upload frame: " + JSON.stringify(err));
										}
									});
								}
							} else {
								writeToChat("Error", "Can only upload imagedata!");
							}
						});
					}
				});
			}
		}
		dragCounter = 0;
		whiteboard.dropIndicator.hide();
	});

	if (accSettings.etherpadUrl == "") {
		$(".etherpadBtn").hide();
	}
}

function showPage(page) {
	currentPage = page;
	$(".page").animate({ "width": "0px" }, "fast", function () {
		$(".page").hide();
		$(page).show();
		$(".page").animate({ "width": "100%" }, "fast");
	});
}

var countDownInterval = 0;
var time = 0;
//Write something to the chat (But cleans it first)
function writeToChat(clientName, text, noClean) {

	clientName = cleanString(clientName);

	if (!noClean)
		text = cleanString(text);
	if (text != "") {
		text = text.linkify();
		text = emojify.replace(text);

		var date = new Date();
		var min = date.getMinutes();
		if (min < 10)
			min = "0" + min;
		var hour = date.getHours();
		if (hour < 10)
			hour = "0" + hour;
		var timeString = hour + ":" + min;

		var nContent = $('<div><b>' + clientName + '<span style="font-size: 0.8em; padding-left: 2px;">(' + timeString + ')</span>: </b>' + text + '</div>');
		nContent.css({ "transition": "color 30s ease", "color": "white" });
		$("#chatContent").append(nContent);
		setTimeout(function () {
			nContent.css({ "color": "rgb(210, 210, 210, 1)" });
		}, 10000);

		var objDiv = document.getElementById("chatContent");
		objDiv.scrollTop = objDiv.scrollHeight;
		$("#chatContent").css({ "transition": "border 0.2s ease", "border": "1px solid #03a9f4" });
		setTimeout(function () {
			$("#chatContent").css({ "transition": "border 0.5s ease", "border": "1px solid black" });
		}, 500);

		Ps.update(document.getElementById('chatContent'));

		if ($("#chatAreaContainer").css("display") == "none") {
			$("#minMaxChat").css("color", "#03a9f4");
		}
	}
}

function show3DManageModal() {
	var bodyHtml = $('<div>' +
		'<table class="table uploaded3DobjsTable">' +
		'<thead>' +
		'<tr>' +
		'<th><b>Name</b></th>' +
		'<th></th>' +
		'<th></th>' +
		'</tr>' +
		'</thead>' +
		'<tbody></tbody>' +
		'</table>' +
		'<a href="#" id="reset3Dspace">Empty 3D View</a><br><br>' +
		'<b>New 3D Object</b>' +
		'<form id="praseiUploadForm" action="#" enctype="multipart/form-data" method="post">' +
		'<table id="newPraesiTable" style="width: 100%;"><tbody>' +
		'<tr>' +
		'<td>Name:</td>' +
		'<td>' +
		'<input name="name3dObj" id="name3dObj" class="form-control" type="text" placeholder="Name...">' +
		'</td>' +
		'</tr>' +
		'<tr>' +
		'<td>Zip File:</td>' +
		'<td>' +
		'<div class="form-control-wrapper fileinput"><input type="text" id="3dfilePlaceholder" readonly="" class="form-control empty"><input name="upload" type="file" id="3dUploadInput"><div class="floating-label">Storage...</div><span class="material-input"></span></div>' +
		'' +
		'</td>' +
		'</tr>' +
		'<tr>' +
		'<td></td>' +
		'<td>' +
		'Be sure to upload in .obj format!<br>' +
		'<button style="padding: 10px;" type="submit" class="btn btn-info">Upload <i style="font-size: 1.3em;" class="uploadBtn fa fa-cloud-upload"></i></button>' +
		'</td>' +
		'</tr>' +
		'</tbody></table>' +
		'</form>' +
		'<div class="infoDiv"></div>' +
		'<div style="color:red;" class="errorDiv"></div>' +
		'</div>');

	showModal({
		titleHTML: "Manage 3D Objects",
		bodyHTML: bodyHtml,
		okBtnText: "hide",
		saveBtnText: "hide",
		onSaveClick: function (mod) { console.log("save"); },
		onOkClick: function (mod) { console.log("onOkClick"); },
		onHidden: function () { $(".3dObjUpload").removeClass("alert-danger"); },
		afterRender: function (mod) {

			render3ObjsTable();
			if (all3DObjects.length == 0) {
				mod.find(".uploaded3DobjsTable").append('<tr><td colspan="3">No Object uploaded yet!</td></tr>');
			}

			mod.find("form").on('submit', function (e) {	//PraesiUpload
				e.preventDefault();
				var FileInput = mod.find("#3dUploadInput");
				var files = FileInput[0].files;
				var name3dObj = cleanString(mod.find("#name3dObj").val());
				mod.find(".errorDiv").empty();
				mod.find(".infoDiv").empty();
				if (name3dObj == "") {
					mod.find(".errorDiv").text("You have to set a name first!");
					return;
				}

				if (files.length <= 0 || mod.find("#3dfilePlaceholder").val() == "") {
					mod.find(".errorDiv").text("No file selected!");
					return;
				}

				var file = files[0];
				var filespilt = file.name.split(".");
				if (filespilt[filespilt.length - 1].toLowerCase() != "zip") {
					mod.find(".errorDiv").text("File must be a zip file!");
					return;
				}

				var formData = new FormData(this);
				formData.append("userId", ownSocketId);
				formData.append("name", name3dObj);
				formData.append("uploadType", "3dObj");
				formData.append("room", roomImIn["roomName"]);
				sendFormData(formData, function (msg) {
					//success callback
					mod.find(".infoDiv").text('Upload completed!');

				}, function (err) {
					mod.find(".errorDiv").text('Error: ' + err);
				}, function (progress) {
					mod.find(".infoDiv").text('Uploading... ' + progress + '%');
					//Upload progress
				}, function (progress) {
					//Download progress
				});
			});

			$("#reset3Dspace").click(function (e) {
				e.preventDefault();
				show3DObj("");
				return false;
			})
		}
	});
}

async function appendCamDevices() {
	if (navigator.mediaDevices) {
		const devices = await navigator.mediaDevices.enumerateDevices();
		$("#screenshareCamSelect").empty();
		for (var i in devices) {
			var device = devices[i];
			var devLabel = device["label"] && device["label"] != "" ? device["label"] : "Video Device " + device["deviceId"].substr(0, 10)
			if (device.kind !== 'audiooutput' && device.kind !== 'audioinput') {
				$("#screenshareCamSelect").append('<option value="' + device["deviceId"] + '">' + devLabel + '</option>');
			}
		}
	}
}

function render3ObjsTable() {
	if ($(".uploaded3DobjsTable").length > 0) {
		$(".uploaded3DobjsTable").find("tbody").empty();
		for (var i = 0; i < all3DObjects.length; i++) {
			(function () {
				if (all3DObjects[i]) {
					var obj = all3DObjects[i];
					var name = all3DObjects[i]["name"];
					var tr = $('<tr><td>' + name + '</td><td class="praesiSettingsIconTd"><i title="show 3D Object" class="eye fa fa-eye"></i></td><td class="praesiSettingsIconTd"><i title="delete 3D Object" class="trash fa fa-trash"></i></td></tr>');
					tr.find(".eye").click(function () {
						var objFile = "";
						var mtlFile = "";
						for (var k = 0; k < obj["fileArray"].length; k++) {
							if (obj["fileArray"][k].toLowerCase().indexOf(".mtl") !== -1) {
								mtlFile = obj["fileArray"][k];
							} else if (obj["fileArray"][k].toLowerCase().indexOf(".obj") !== -1) {
								objFile = obj["fileArray"][k];
							}
						}
						if (objFile == "") {
							$(".errorDiv").text("3D Model don't contain an .obj file! Delete and reopload with correct format!");
							return;
						}
						var url = "./3dViewer/index.html?folder=../3dObjs/" + name + "/&obj=" + objFile + "&mtl=" + mtlFile;
						console.log(url);
						show3DObj(url);
					});
					tr.find(".trash").click(function () {
						delete3DObj(name);
					});
					$(".uploaded3DobjsTable").find("tbody").append(tr);
				}
			})();
		}
	}
}

function getUserNameFromId(id) {
	if ($("#" + id).length == 1) {
		return $("#" + id).find(".username").text();
	}
	return "notFound!";
}

function getUserColor(id) {
	return $("#" + id + " .colorPickerDiv").css("background-color");
}

function refreshMuteUnmuteAll() {
	$.each($(".userdiv"), function () {
		var socketId = $(this).attr('id');

		var username = $(this).find(".username").text();
		var audioElement = null;
		var muted = true;

		var micEnabled = $($(this).find(".micToSpeak")[0]).attr("mic") == "true" ? true : false;
		if (micEnabled) {
			muted = false;
		}

		if ($(this).find(".fa-bullhorn").length > 0) {
			muted = false;
		}

		if (roomImIn["moderator"] == socketId) {
			muted = false;
		}

		if ($(this).find(".fa-microphone-slash").length > 0) {
			muted = true;
		}

		if (socketId != ownSocketId) {
			if ($(".socketId" + socketId).find("audio").length >= 1) { //find user audio by socketId
				audioElement = $(".socketId" + socketId).find("audio");
			} else if ($(".audiocontainer[username=" + username + "]").find("audio").length >= 1) { //Fallback to username
				audioElement = $(".audiocontainer[username=" + username + "]").find("audio");
			}

			if (audioElement) {
				if (silence) {
					audioElement.prop('muted', true);
				} else {
					audioElement.prop('muted', muted);
				}
			} else {
				var found = false;
				for (var i in myMCU.allStreamAttributes) {
					if (myMCU.allStreamAttributes[i].socketId == socketId) {
						found = true;
					}
				}
				muted = !found ? "error" : muted;
			}
		}

		$(this).find(".UserRightTD").attr("title", "");
		if (muted == "error") {
			$(this).find(".UserRightTD").css({ "background": "rgba(244, 3, 3, 0.26)" });
			$(this).find(".UserRightTD").attr("title", "No audiostream for this user yet!");

		} else if ((socketId == ownSocketId && !localAudioStream)) {
			$(this).find(".UserRightTD").css({ "background": "rgba(244, 3, 3, 0.26)" });
			$(this).find(".UserRightTD").attr("title", "No audio streaming. Allow mic access and check chat window for help!");
		} else if (muted) {
			$(this).find(".UserRightTD").css({ "background": "#03a9f400" });
			if (socketId == ownSocketId && gainNode) {
				gainNode.gain.value = 0;
			}
			if (socketId == ownSocketId && localAudioStream && !localAudioStream.audioMuted) {
				myMCU.muteMediaStream(true, localAudioStream);
			}
		} else {
			$(this).find(".UserRightTD").css({ "background": "#03a9f442" });
			if (socketId == ownSocketId && gainNode) {
				gainNode.gain.value = 1;
			}
			if (socketId == ownSocketId && localAudioStream && localAudioStream.audioMuted) {
				myMCU.muteMediaStream(false, localAudioStream);
			}

		}
	});
}

window.addEventListener("dragover", function (e) {
	e = e || event;
	e.preventDefault();
}, false);
window.addEventListener("drop", function (e) {
	e = e || event;
	e.preventDefault();
}, false);

window.addEventListener("paste", function (e) {
	if (currentTab == "#whiteboardScreen") {
		if (e.clipboardData) {
			var items = e.clipboardData.items;
			if (items) {
				// Loop through all items, looking for any kind of image
				for (var i = 0; i < items.length; i++) {
					if (items[i].type.indexOf("image") !== -1) {
						// We need to represent the image as a file,
						var blob = items[i].getAsFile();

						var reader = new window.FileReader();
						reader.readAsDataURL(blob);
						reader.onloadend = function () {
							writeToChat("Server", "Uploading image!");
							base64data = reader.result;
							var date = (+new Date());
							$.ajax({
								type: 'POST',
								url: document.URL.substr(0, document.URL.lastIndexOf('/')) + '/upload',
								data: {
									'imagedata': base64data,
									'room': roomImIn["roomName"],
									'name': "whiteboard",
									'date': date,
									'userId': ownSocketId,
									'uploadType': "singleFileUpload"
								},
								success: function (msg) {
									var filename = username + "_whiteboard_" + date + ".png";
									whiteboard.addImgToCanvasByUrl(document.URL.substr(0, document.URL.lastIndexOf('/')) + "/singlefiles/" + filename);
									writeToChat("Server", "Image uploaded!");

								},
								error: function (err) {
									writeToChat("Error", "Failed to upload frame: " + JSON.stringify(err));
								}
							});
						}
					}
				}
			}
		}
	}
});
