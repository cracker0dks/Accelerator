var currentPage = null;
var username = "dummy";
var allLoadedPraesis = null;
var currentPraesiName = null;
var currentPraesiSlide = 0;
var remoteClick = false;
var zoomEnabled = false;
var zoomFactor = 1.5;
var isFullScreen = false;
var window_focus = true;
var camera3D = false;
var prevOutputDevice = localStorage.getItem("prevOutputDevice") || false;
var prevAudioInputDevice = localStorage.getItem("prevAudioInputDevice") || false;
var prevVideoInputDevice = localStorage.getItem("prevVideoInputDevice") || false;

$(function () { //Document ready
	$.material.init();
	if (!signaling_socket)
		initSocketIO(); //Init SocketIO Server

	showPage("#loginPage");
	/* LOGIN PAGE */
	$("#loginBtn").click(function () {
		username = cleanString($("#inputUser").val());
		username = username.replaceAll(" ", "_");
		username = username.replaceAll(".", "_");
		username = username.replaceAll("#", "_");
		setLocalStorage("myUserName", username);
		var password = cleanString($("#inputPassword").val());
		if (username === "") {
			$('#inputUser').popover({ "show": "true", "content": "Username is empty!", "placement": "right" });
			$('#inputUser').popover('toggle');
			// } else if(password === "") {
			// 	$('#inputPassword').popover({ "show": "true", "content" : "Password is empty!", "placement" : "right" });
			// 	$('#inputPassword').popover('toggle');
		} else {
			setUserAttr(username, password);
			showPage("#accessMicPage");

			var constraints = { echoCancellation: { ideal: true } };
			if (localStorage.getItem("prevAudioInputDevice")) {
				constraints["deviceId"] = { ideal: localStorage.getItem("prevAudioInputDevice") }
			}
			navigator.getUserMedia({ audio: constraints, video: false }, async function (stream) {
				localAudioStream = stream;
				continueToRoomPage();
				appendCamDevices();
			}, function (err) {
				alert("Audio input error. Run the Audio / Video Setup to fix this.");
				continueToRoomPage();
				console.log(err);
			});

			function continueToRoomPage() {
				//Join a room directly if url get parameter is set   
				showPage("#roomPage");
				sendGetAllRooms();
				var roomName = getQueryVariable("room");
				if (roomName && roomName != "" && username && username != "dummy") {
					$("#directRoomName").text(decodeURIComponent(roomName));
					$('#connectModal').modal({ backdrop: 'static', keyboard: false });
					$('#connectModal').find("#acceptDirectConnect").click(function () {
						$($("#roomListContent").find(".roomLaBle[roomName=" + escape(decodeURIComponent(roomName)).replace(/[^a-zA-Z0-9 ]/g, "") + "]")[0]).click();
					})
				}
			}
		}
		$("#notConnected").hide();

	});

	$("#groopRoomSearch").keyup(function () {
		filterRooms();
	});

	$("#youtubeVolumeSlider").noUiSlider({
		start: [50],
		range: {
			'min': 0,
			'max': 100
		}
	});

	if (getLocalStorage("myUserName") != false) {
		$("#inputUser").val(getLocalStorage("myUserName"));
	}
	/* - END - LOGIN PAGE */

	/* room PAGE */

	$("#newRoomPassword").keyup(function () {
		if ($(this).val() != "") {
			$("#roomPwLockIcon").removeClass("fa-unlock-alt").addClass("fa-lock");
		} else {
			$("#roomPwLockIcon").removeClass("fa-lock").addClass("fa-unlock-alt");
		}
	});

	/* - END - room PAGE */

	/* MAIN PAGE */
	$("#userTootldropBtn").click(function () {
		if ($("#userToolDiv").css("display") == "none")
			$("#userToolDiv").show();
		else
			$("#userToolDiv").hide();
	});

	$("#userToolDiv>.fa, #userTootldropBtn>.fa").on("click", function () {
		$("#userTootldropBtn").find(".fa").appendTo("#userToolDiv");
		$(this).prependTo("#userToolBarPrev");
	});

	function getTextFromChatDiv(chatDiv) {
		$.each(chatDiv.find("img"), function () {
			var txt = $(this).attr("title");
			$(this).replaceWith(txt);
		});
		return chatDiv.text();
	}

	//Chat Button
	$("#chatButtonWrapper").click(function () {
		var theChatMsg = getTextFromChatDiv($("#chatInput"));
		$("#chatInput").html("");
		var chatTextToSend = cleanString(theChatMsg);
		theChatMsg = "";
		sendChatMsg(chatTextToSend);
	});

	$("#chatInput").keypress(function (event) {
		if (event.which == 32) { //Space
			var theChatMsg = getTextFromChatDiv($("#chatInput"));
			$("#chatInput").html(emojify.replace(theChatMsg));
			$("#chatInput").focusEnd();
		}
		if (event.which == 13) { //Enter
			event.preventDefault();
			if (currentPage == "#mainPage" || !currentPage) {
				var theChatMsg = getTextFromChatDiv($("#chatInput"));
				$("#chatInput").html("");
				var chatTextToSend = cleanString(theChatMsg);
				theChatMsg = "";
				sendChatMsg(chatTextToSend);
			} else if (currentPage == "#loginPage") {
				$("#loginBtn").click();
			}
		}
	});

	$("#setupCheckBtn").click(function () {
		$("#setupCheckBtn").attr("disabled", "true")
		setTimeout(function () {
			$("#setupCheckBtn").removeAttr("disabled")
		}, 2000)
		var testAudioStream = null;
		var testVideoStream = null;
		var sourceNode = null;
		var oscillator = null;
		var oneOutputDevice = false;
		var oneVideoInput = false;
		var audioInputProgressBar = $('<progress value="0" max="100" style="width: 300px;">0</progress>');

		var constraints = prevAudioInputDevice ? { deviceId: { ideal: prevAudioInputDevice } } : true;
		navigator.getUserMedia({ audio: constraints, video: false }, async function (stream) {
			var audioOutputSelect = $('<select style="width: 300px;"></select>');
			var audioInputSelect = $('<select style="width: 300px;"></select>');
			var videoInputSelect = $('<select style="width: 300px;"></select>');

			const devices = await navigator.mediaDevices.enumerateDevices();

			for (var i in devices) {
				var device = devices[i];
				var devLabel = device["label"] && device["label"] != "" ? device["label"] : "Video Device " + device["deviceId"].substr(0, 10)
				if (device.kind === 'audiooutput') {
					audioOutputSelect.append('<option value="' + device["deviceId"] + '">' + devLabel + '</option>');
					oneOutputDevice = true;
				} else if (device.kind === 'audioinput') {
					audioInputSelect.append('<option value="' + device["deviceId"] + '">' + devLabel + '</option>');
				} else { //VideoInput
					videoInputSelect.append('<option value="' + device["deviceId"] + '">' + devLabel + '</option>');
					oneVideoInput = true;
				}
			}

			if (prevOutputDevice) {
				audioOutputSelect.val(prevOutputDevice);
			}
			if (prevAudioInputDevice) {
				audioInputSelect.val(prevAudioInputDevice);
			}
			if (prevVideoInputDevice) {
				videoInputSelect.val(prevVideoInputDevice);
			}

			//Outputdevices Only on chrome
			if (oneOutputDevice) {
				$("#audioOutputDevs").empty().append(audioOutputSelect)
			} else {
				$("#audioOutputDevs").html("Outputdevice selection is unavailable in this browser.");
			}

			var audioOutputStartBtn = $('<button class="btn btn-primary" style="padding:5px;"><i class="fa fa-play-circle-o" aria-hidden="true"></i> Test</button>');
			var audioOutputStopBtn = $('<button class="btn btn-primary" style="padding:5px; display:none;"><i class="fa fa-play-circle-o" aria-hidden="true"></i> Stop</button>');

			audioOutputStartBtn.click(function () {
				$("#mediaSetupOutput").empty();
				var ac = new AudioContext();
				var audio = new Audio();
				oscillator = ac.createOscillator();
				oscillator.start();
				var dest = ac.createMediaStreamDestination();
				oscillator.connect(dest);
				audio.srcObject = dest.stream;
				audio.play();
				if (oneOutputDevice && audio.setSinkId) {
					audio.setSinkId(audioOutputSelect.val())
				}

				audioOutputStartBtn.hide();
				audioOutputStopBtn.show();

				$("#mediaSetupOutput").html("You should hear some noise!");
			})

			audioOutputStopBtn.click(function () {
				if (oscillator) {
					oscillator.disconnect();
					oscillator.stop(0);
				}
				audioOutputStopBtn.hide();
				audioOutputStartBtn.show();

				$("#mediaSetupOutput").html("If you had problems hearing the noise, select an other device and try again. Also try and check your operating systems settings like the windows mixed if your browser is muted.");
			});
			$("#audioOutputTest").empty().append(audioOutputStartBtn).append(audioOutputStopBtn);
			$("#audioOutputSetup").show();

			//Audio Input
			$("#audioInputDevs").empty().append(audioInputSelect).append(audioInputProgressBar)
			var audioInputBtn = $('<button class="btn btn-primary" style="padding:5px;"><i class="fa fa-play-circle-o" aria-hidden="true"></i> Test</button>');
			var audioStopBtn = $('<button class="btn btn-primary" style="padding:5px; display:none;"><i class="fa fa-stop-circle-o" aria-hidden="true"></i> Stop</button>');

			audioInputBtn.click(function () {
				$("#mediaSetupOutput").empty();
				var constraints = { deviceId: { ideal: audioInputSelect.val() } };
				navigator.getUserMedia({ audio: constraints, video: false }, async function (stream) {
					testAudioStream = stream;
					const audioContext = new AudioContext();
					sourceNode = audioContext.createMediaStreamSource(stream);

					var analyser = audioContext.createAnalyser();
					analyser.fftSize = 2048;
					var bufferLength = analyser.frequencyBinCount;
					var dataArray = new Uint8Array(bufferLength);
					analyser.getByteTimeDomainData(dataArray);

					function calcVolume() {
						if (sourceNode) {
							requestAnimationFrame(calcVolume);
						}

						analyser.getByteTimeDomainData(dataArray);
						var mean = 0;
						for (var i = 0; i < dataArray.length; i++) {
							mean += Math.abs(dataArray[i] - 127);
						}
						mean /= dataArray.length;
						mean = Math.round(mean);
						mean = mean <= 1 ? 0 : mean;
						audioInputProgressBar.val(mean * 4)
					}
					calcVolume();
					sourceNode.connect(analyser);
					analyser.connect(audioContext.destination);

					audioInputBtn.hide();
					audioStopBtn.show();
					$("#mediaSetupOutput").html("If you hear yourself now, everything is fine! If not, try an other input device.")
				}, function (err) {
					$("#mediaSetupOutput").html("Error getting user media for selected device! Try this:<br>" +
						"1. Make sure you are not using this device with other programs.<br>" +
						"2. Make sure you select a device with mic plugged in. Not a controller or something.<br>" +
						"3. Unplug/disable unused audio devices, refresh the page and try again.<br>");
					console.log(err)
				});
				console.log(audioInputSelect.val())
			})
			audioStopBtn.click(function () {
				if (sourceNode) {
					sourceNode.disconnect();
					sourceNode = null;
				}
				audioInputBtn.show();
				audioStopBtn.hide();
				testAudioStream.getTracks().forEach(function (track) {
					track.stop();
				});
				if (oscillator) {
					oscillator.disconnect();
					oscillator.stop(0);
				}
				audioInputProgressBar.val(1);
			});
			$("#audioInputTest").empty().append(audioInputBtn).append(audioStopBtn);

			//Video Input
			$("#webcamInputDevs").empty().append(videoInputSelect)
			var webcamTestStartBtn = $('<button class="btn btn-primary" style="padding:5px;"><i class="fa fa-play-circle-o" aria-hidden="true"></i> Test</button>');
			var webcamTestStopBtn = $('<button class="btn btn-primary" style="padding:5px; display:none;"><i class="fa fa-stop-circle-o" aria-hidden="true"></i> Stop</button>');
			webcamTestStartBtn.click(function () {
				$("#mediaSetupOutput").empty();

				var constraints = { deviceId: { ideal: videoInputSelect.val() } };
				webcamTestStartBtn.hide();
				navigator.getUserMedia({ audio: false, video: constraints }, async function (stream) {
					testVideoStream = stream;
					var mediaDiv = $('<div id="localVideoTestDiv" style="width:300px;"><video style="width:300px; transform: scaleX(-1);" autoplay="true" muted></video></div>');
					mediaDiv.find("video")[0].srcObject = stream;
					$("#webcamInputDevs").append(mediaDiv)

					webcamTestStopBtn.show();
				}, function (err) {
					webcamTestStartBtn.show();
					$("#mediaSetupOutput").html("Error getting user media for selected device! Make sure you are not using this device with any other programs and try again.");
					console.log(err)
				});
			})

			webcamTestStopBtn.click(function () {
				if (testVideoStream) {
					testVideoStream.getTracks().forEach(function (track) {
						track.stop();
					});
				}
				$("#localVideoTestDiv").remove();
				webcamTestStartBtn.show();
				webcamTestStopBtn.hide();
				$("#mediaSetupOutput").empty();
			})
			if (oneVideoInput) {
				$("#webcamInputTest").empty().append(webcamTestStartBtn).append(webcamTestStopBtn);
			} else {
				$("#webcamInputDevs").html('No video device found!');
			}

			$('#setUpCheckModal').modal({ backdrop: 'static', keyboard: false });
			$('#setUpCheckModal').on('hidden.bs.modal', function () {
				if (testAudioStream) {
					testAudioStream.getTracks().forEach(function (track) {
						track.stop();
					});
				}
				if (testVideoStream) {
					testVideoStream.getTracks().forEach(function (track) {
						track.stop();
					});
				}
				if (sourceNode) {
					sourceNode.disconnect();
					sourceNode = null;
				}
				if (oscillator) {
					oscillator.disconnect();
					oscillator.stop(0);
					oscillator = null;
				}
			});
			$("#setupCheckSaveBtn").click(function () {
				if (oneOutputDevice) {
					prevOutputDevice = audioOutputSelect.val();
					localStorage.setItem("prevOutputDevice", audioOutputSelect.val())
				}

				prevAudioInputDevice = audioInputSelect.val();
				localStorage.setItem("prevAudioInputDevice", audioInputSelect.val())

				var constraints = { deviceId: { ideal: audioInputSelect.val() } };
				navigator.getUserMedia({ audio: constraints, video: false }, async function (stream) {
					localAudioStream = stream;
				});

				if (oneVideoInput) {
					prevVideoInputDevice = videoInputSelect.val()
					localStorage.setItem("prevVideoInputDevice", videoInputSelect.val())
				}

				$('#setUpCheckModal').modal('hide');
			})
			console.log(devices)
			//Remove req device
			stream.getTracks().forEach(function (track) {
				track.stop();
			});
		}, function (err) {
			alert("Error getting usermedia! Connect a microphone and allow the access in your browser.")
			console.log(err)
		});

	});

	$("#createNewRoomBtn").click(function () {
		var romname = cleanString($("#createNewRoomInput").val().trim());
		romname = romname.replaceAll(".", "_");
		romname = romname.replaceAll("#", "_");
		for(var i in allRooms) {
			if(allRooms[i].roomName.split("###")[0] == romname) {
				return alert("Roomname already excits! Please use a different one!")
			}
		}
		if (romname != "" && romname.length >= 3) {
			var roomName = romname + "###" + (+new Date());
			var roomPassword = cleanString($("#newRoomPassword").val());
			if (roomName && roomName != "") {
				sendCreateNewRoom(roomName, roomPassword);
			}
			$("#createNewRoomInput").val("");
			$("#newRoomPassword").val("");
			$("#roomPwLockIcon").removeClass("fa-lock").addClass("fa-unlock-alt");
		} else {
			alert("Roomname must have more than 3 Chars!")
		}
	});

	$("#elsePraesiInfo").click(function () {
		$('#praesiInfoModal').modal('show');
	});

	//ModToolbar Click Effect
	$(".notActiveBtn").mousedown(function () {
		$(this).addClass("alert-danger");
	});

	$(".notActiveBtn").mouseleave(function () {
		$(this).removeClass("alert-danger");
	});

	$(".mainTab").click(function () {
		$(this).addClass("alert-danger");
		$(".mainTab").removeClass("alert-danger");
	});

	//Scrollbar
	Ps.initialize(document.getElementById('chatContent'));
	Ps.initialize(document.getElementById('fileTableWrapper'));
	Ps.initialize(document.getElementById('userPanel'));
	Ps.initialize(document.getElementById('roomListContainer'));

	//Hide show chat
	$("#minMaxChat").clickToggle(function (_this) {
		$("#chatAreaContainer").hide();
		$("#chatAreaDummy").show();
		$(_this).removeClass("fa-caret-down").addClass("fa-caret-up");
		updateChatHideShowToggle();
	}, function (_this) {
		$("#minMaxChat").css("color", "black");
		$("#chatAreaContainer").show();
		$("#chatAreaDummy").hide();
		$(_this).addClass("fa-caret-down").removeClass("fa-caret-up");
		updateChatHideShowToggle();
		var objDiv = document.getElementById("chatContent");
		objDiv.scrollTop = objDiv.scrollHeight;
	});

	//File Upload and Notes ////////////////////////
	$("#showFiles").click(function () {
		if ($(this).hasClass("alert-danger")) {
			$("#chatAreaContainer").removeClass("col-xs-6");
			$("#chatAreaContainer").addClass("col-xs-12");
			$("#noteDiv").hide();
			$("#fileDiv").hide();
			$("#minMaxChat").css("left", "50%");
			updateChatHideShowToggle();
		} else {
			$("#chatAreaContainer").removeClass("col-xs-12");
			$("#chatAreaContainer").addClass("col-xs-6");
			$("#fileDiv").show();
			$("#noteDiv").hide();
			$("#showNotes").removeClass("alert-danger");
			$("#minMaxChat").css("left", "25%");
			updateChatHideShowToggle();
		}
	});

	$("#showNotes").click(function () {
		if ($(this).hasClass("alert-danger")) {
			$("#chatAreaContainer").removeClass("col-xs-6");
			$("#chatAreaContainer").addClass("col-xs-12");
			$("#noteDiv").hide();
			$("#fileDiv").hide();
			$("#minMaxChat").css("left", "50%");
			updateChatHideShowToggle();
		} else {
			$("#chatAreaContainer").removeClass("col-xs-12");
			$("#chatAreaContainer").addClass("col-xs-6");
			$("#noteDiv").show();
			$("#fileDiv").hide();
			$("#showFiles").removeClass("alert-danger");
			$("#minMaxChat").css("left", "25%");
			updateChatHideShowToggle();
		}
	});

	function updateChatHideShowToggle() {
		if (($("#noteDiv").css("display") != "none" || $("#fileDiv").css("display") != "none") && $("#chatAreaContainer").css("display") == "none") {
			$("#minMaxChat").css({ "top": "initial", "bottom": "-4px" });
		} else if ($("#chatAreaContainer").css("display") != "none") {
			$("#minMaxChat").css({ "bottom": "initial", "top": "-4px" });
		} else {
			$("#minMaxChat").css({ "bottom": "initial", "top": "-12px" });
		}
	}

	$("#shareNotes").click(function () {
		var txt = $.trim($("#noteTextArea").val());
		if (txt != "") {
			sendSharNotes(txt, "note");
			$("#shareNotes").prop('disabled', true);
			writeToChat("System", "Note shared!");
		} else {
			writeToChat("System", "Note is emty! Can not share!");
		}
	});

	$("#shareNotesToChat").click(function () {
		var txt = $.trim($("#noteTextArea").val());
		var parts = txt.split("\n");
		for (var i in parts) {
			sendChatMsg(parts[i]);
		}
	});

	$("#noteTextArea").keydown(function () {
		$("#shareNotes").prop('disabled', false);
	});

	$("#noteTextArea").on("blur", function () {
		var txt = $("#noteTextArea").val();
		prepareNoteDl(txt, "notizen.txt", 'text/plain');
	});

	$("#logoutBtn").click(function () {
		var link = window.location.href.split("/?")[0] + '/';
		window.location.replace(link);
	});

	$('#toggle_fullscreen').on('click', function () {
		// if already full screen; exit
		// else go fullscreen

		if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
			resetFullscreenStyle();
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			} else if (document.webkitExitFullscreen) {
				document.webkitExitFullscreen();
			} else if (document.msExitFullscreen) {
				document.msExitFullscreen();
			}

		} else {
			isFullScreen = true;
			setFullscreenStyle();
			element = $('#mainContainer').get(0);
			if (element.requestFullscreen) {
				element.requestFullscreen();
			} else if (element.mozRequestFullScreen) {
				element.mozRequestFullScreen();
			} else if (element.webkitRequestFullscreen) {
				element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
			} else if (element.msRequestFullscreen) {
				element.msRequestFullscreen();
			}
		}
	});

	if (document.addEventListener) {
		document.addEventListener('webkitfullscreenchange', exitHandler, false);
		document.addEventListener('mozfullscreenchange', exitHandler, false);
		document.addEventListener('fullscreenchange', exitHandler, false);
		document.addEventListener('MSFullscreenChange', exitHandler, false);
	}

	function exitHandler() {
		if (document.webkitIsFullScreen === false || document.mozFullScreen === false || document.msFullscreenElement === false) {
			isFullScreen = false;
			resetFullscreenStyle();
		}
	}

	if (isSmallDevice() || isMobileOrTablet()) {
		$("#toggle_fullscreen").css({ "font-size": "30px" });
	}

	$("#screenShareTabBtn").click(function () {
		var browser = getBrowser();
		if (browser != "firefox" && browser != "blinkEngin") {
			writeToChat("Server", "Warning: Screenshare was not tested for your browser! Use a supported browser like chrome or Firefox to be sure!");
		}
	});

	$("#startScreenShareBtn").click(function () {
		if (!screen_publishing) {
			$("#startScreenShareBtn").attr("disabled", "true");
			$("#screenshareQuallyTable").hide();
			$("#startScreenShareBtn").text("please wait...!");
			writeToChat("Server", "Try to access Screen!");
			var qIndex = $("#screenshareQually").val();

			var maxWidth = 480;
			var maxHeight = 360
			if (qIndex == 1) {
				maxWidth = 1920;
				maxHeight = 1080;
			} else if (qIndex == 2) {
				maxWidth = 1280;
				maxHeight = 720;
			} else if (qIndex == 3) {
				maxWidth = 640;
				maxHeight = 480;
			}
			var maxFPS = accSettings && accSettings["screenshareConfig"] && accSettings["screenshareConfig"]["maxFPS"] ? accSettings["screenshareConfig"]["maxFPS"] : 15;
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

			var config = {
				screen: true,
				attributes: { socketId: ownSocketId },
				video: newVidConstrains
			};

			var sIndex = $("#screenshareSource").val();

			if (sIndex == 1) {
				(async function () {
					writeToChat("Server", "Screenstream Connecting...");
					var stream;
					try {
						stream = await _startScreenCapture();
					} catch (e) {
						console.log(e)
						writeToChat("ERROR", "Access to screen rejected!");
						$("#startScreenShareBtn").removeAttr("disabled", "false");
						$("#startScreenShareBtn").text("start screenshare!");
						$("#screenshareQuallyTable").show();
						return;
					}

					stream["streamAttributes"] = { "screenshare": true };
					screen_stream = stream;
					if (stream) {
						myMCU.publishStreamToRoom(roomImIn["roomName"], stream, function (err) {
							if (err) {
								writeToChat("ERROR", "Stream could not be published! Error: " + err);
								$("#startScreenShareBtn").removeAttr("disabled");
								$("#screenshareQuallyTable").show();
							} else {
								screen_publishing = true;
								apendScreenshareStream(stream, { streamSocketId: ownSocketId });
							}
						});
					}

					function _startScreenCapture() {
						if (navigator.getDisplayMedia) {
							return navigator.getDisplayMedia(config);
						} else if (navigator.mediaDevices.getDisplayMedia) {
							return navigator.mediaDevices.getDisplayMedia(config);
						} else {
							return navigator.mediaDevices.getUserMedia(config);
						}
					}

				})();
			} else {
				var camId = $("#screenshareCamSelect").val();
				if (camId) {
					newVidConstrains["deviceId"] = { ideal: camId };
				}
				navigator.getUserMedia({ audio: false, video: newVidConstrains }, function (stream) {
					stream["streamAttributes"] = { "screenshare": true };
					screen_stream = stream;
					myMCU.publishStreamToRoom(roomImIn["roomName"], stream, function (err) {
						if (err) {
							writeToChat("ERROR", "Stream could not be published! Error: " + err);
							$("#startScreenShareBtn").removeAttr("disabled");
							$("#screenshareQuallyTable").show();
						} else {
							screen_publishing = true;
							apendScreenshareStream(stream, { streamSocketId: ownSocketId });
						}
					});
				}, function (err) {
					console.error(err);
					writeToChat("ERROR", "Access to cam rejected!");
					$("#startScreenShareBtn").removeAttr("disabled", "false");
					$("#startScreenShareBtn").text("start screenshare!");
					$("#screenshareQuallyTable").show();
				});
			}

		} else {
			myMCU.unpublishStream(screen_stream)
			screen_publishing = false;
			$("#startScreenShareBtn").css("position", "relative");
			$("#startScreenShareBtn").text("start screenshare!");
		}
	});

	$('body').on('click', function (e) {
		$('#smilieSvg').each(function () {
			//the 'is' for buttons that trigger popups
			//the 'has' for icons within a button that triggers a popup
			if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
				$(this).popover('hide');
			}
		});
	});

	var smString = ":angry::anguished::thumbsup::-1::baby_chick::astonished::blush::clap::beer::disappointed_relieved::disappointed::dizzy_face::cry::confused::confounded::cop::frowning::flushed::hushed::kissing_heart::kissing_smiling_eyes::heartbeat::neutral_face::horse::monkey_face::mask::laughing::kissing_smiling_eyes::kissing_heart::joy::hankey::hear_no_evil::heart::smile::yum::worried::wink::triumph::tired_face::sunglasses::stuck_out_tongue::stuck_out_tongue_winking_eye:";
	var emos = "";
	for (var i = 0; i < emojify.emojiNames.length; i++) {
		if (smString.indexOf(emojify.emojiNames[i]) != -1) {
			emos += " :" + emojify.emojiNames[i] + ":";
		}
	}
	emos = emojify.replace(emos);
	$("#smilieSvg").popover({ "show": "true", "html": "true", "content": '<div style="max-height:400px;">' + emos + '</div>', "placement": "left" });

	$("body").delegate(".emoji", "click", function () {
		var theChatMsg = getTextFromChatDiv($("#chatInput"));
		theChatMsg += $(this).attr("alt");
		$("#chatInput").html(emojify.replace(theChatMsg));
		$("#chatInput").focusEnd();
	});

	$("#userTools").find(".fa").draggable({
		appendTo: "body",
		helper: "clone",
		start: function () {
			$("#praesiDragOverlay").show();
		},
		stop: function () {
			$("#praesiDragOverlay").hide();
		}
	});

	$(".praesiMainContent").droppable({
		drop: function (event, ui) {

			if (ui.draggable.attr("droped") != "true") {
				var pos = getItemPosiInPercent(event)
				var xp = pos.x;
				var yp = pos.y;

				var item = "";
				if (ui.draggable.hasClass("fa-square")) {
					item = "sqare";
				} else if (ui.draggable.hasClass("fa-circle")) {
					item = "circle";
				} else if (ui.draggable.hasClass("fa-heart")) {
					item = "heart";
				} else if (ui.draggable.hasClass("fa-caret-up")) {
					item = "caret-up";
				} else if (ui.draggable.hasClass("fa-caret-down")) {
					item = "caret-down";
				} else if (ui.draggable.hasClass("fa-caret-left")) {
					item = "caret-left";
				} else if (ui.draggable.hasClass("fa-caret-right")) {
					item = "caret-right";
				} else if (ui.draggable.hasClass("fa-star")) {
					item = "star";
				} else if (ui.draggable.hasClass("fa-pencil-square-o")) {
					item = "pencil-square";
				} else if (ui.draggable.hasClass("fa-cloud")) {
					item = "cloud";
				} else if (ui.draggable.hasClass("fa-file-text")) {
					item = "textfield";
				} else if (ui.draggable.hasClass("fa-picture-o")) {
					item = "image";
				} else if (ui.draggable.hasClass("fa-video-camera")) {
					item = "camera";
				} else if (ui.draggable.hasClass("fa-arrow-up")) {
					item = "arrowUp";
				} else if (ui.draggable.hasClass("fa-arrow-down")) {
					item = "arrowDown";
				} else if (ui.draggable.hasClass("numberone")) {
					item = "numberone";
				} else if (ui.draggable.hasClass("numbertwo")) {
					item = "numbertwo";
				} else if (ui.draggable.hasClass("numberthree")) {
					item = "numberthree";
				} else if (ui.draggable.hasClass("numberfour")) {
					item = "numberfour";
				} else if (ui.draggable.hasClass("numberfive")) {
					item = "numberfive";
				} else if (ui.draggable.hasClass("numbersix")) {
					item = "numbersix";
				} else if (ui.draggable.hasClass("numberseven")) {
					item = "numberseven";
				} else if (ui.draggable.hasClass("numbereight")) {
					item = "numbereight";
				} else if (ui.draggable.hasClass("numbernine")) {
					item = "numbernine";
				} else if (ui.draggable.hasClass("numbernull")) {
					item = "numbernull";
				}
				var dropId = ownSocketId + (new Date().getTime());
				sendAddUserPItem(item, xp, yp, dropId);
			}
		}
	});

	$("#praesiCursorBtn").click(function () {
		if (!$(this).hasClass("alert-danger")) {
			sendCursorPosition({ "x": 0, "y": 0 });
			$("#praesiDragOverlay").show();
		} else {
			$('.praesiCursor').remove();
			sendCursorPosition({ "x": "none", "y": "none" });
			$("#praesiDragOverlay").hide();
		}
	});

	$("#userRemoveUserPItemsBtn").click(function () {
		sendRemoveAllUserPItems();
	});

	$("#userTootlsBtn").click(function () {
		if ($('.userTools').css('display') != 'none')
			sendShowHideUserPItems("hide");
		else
			sendShowHideUserPItems("show");
	});

	$("#praesiZoomBtn").click(function () {
		zoomEnabled = !zoomEnabled;
		if (zoomEnabled) {
			$("#praesiZoomOverlay").show();
			$("#mainContainer").css({ "cursor": "zoom-in" });
			writeToChat("INFO", "Zoom enabled! Spinn the mousewheel to change the zoomfactor!");
		} else {
			$("#praesiZoomOverlay").hide();
			$("#mainContainer").css({ "cursor": "default" });
			var content = {
				xpro: 0,
				ypro: 0,
				scale: "1,1"
			}
			sendZoom(content);
		}
	});

	document.addEventListener('wheel', mouseWheelEvent);

	function mouseWheelEvent(e) {
		if (zoomEnabled && roomImIn && roomImIn["moderator"] == ownSocketId) {

			/* Determine the direction of the scroll (< 0 → up, > 0 → down). */
			var delta = ((e.deltaY || -e.wheelDelta || e.detail) >> 10) || 1;

			if (delta < 0) {
				zoomFactor = zoomFactor + 0.5;
				if (zoomFactor > 4) {
					zoomFactor = 4;
				}
			}
			else {
				zoomFactor = zoomFactor - 0.5;
				if (zoomFactor < 1) {
					zoomFactor = 1;
				}
			}
			refeshZoom();
		}
	}

	var xpro = 0;
	var ypro = 0;
	var mouseMoveEvent = null;


	$("#mainContainer").on('mousemove', function (event) {
		refreshCursorPosition(event);

		if (roomImIn && roomImIn["moderator"] == ownSocketId) {
			mouseMoveEvent = event;
			refeshZoom();
		}
	});

	function refeshZoom() {
		if (zoomEnabled) {	//Zoom
			var mainC = $("#mainContainer");
			var offset = mainC.offset();
			var x = mouseMoveEvent.pageX - offset.left;
			var y = mouseMoveEvent.pageY - offset.top;

			var width = mainC.width();
			var height = mainC.height();

			xpro = Math.round(((x / (width / 100) - 50) * -0.5) * 100) / 100;
			ypro = Math.round(((y / (height / 100) - 50) * -0.16 * (zoomFactor / 0.5 - 1)) * 100) / 100;

			var content = {
				xpro: xpro,
				ypro: ypro,
				scale: zoomFactor + "," + zoomFactor
			}
			sendZoom(content);
		}
	}

	var keysDown = {};
	$(document).keydown(function (event) {
		if (!keysDown[event.which]) {
			keysDown[event.which] = true;
			if (event.which == 13) {
				if (currentPage == "#loginPage") {
					$("#loginBtn").click();
				}
			}

			if (currentTab == "#homeScreen" && playingSnake) {
				console.log(event.which);
				signaling_socket.emit('snakeKeyPressed', event.which);
			}
		}
	});

	$(document).keyup(function (event) {
		delete keysDown[event.which];
	});

	$(window).focus(function () {
		window_focus = true;
		sendUserStatus("onscreen");
	}).blur(function () {
		if ($(document.activeElement).attr("id") != "pdfIFrame" && $(document.activeElement).attr("id") != "revealIFrame") {
			window_focus = false;
			sendUserStatus("not-onscreen");
		}
	});

	$("#singleFileUpload").change(function () {
		$("#singleFileUploadForm").submit();
	});

	$("#3DIframe").on("load", function () {
		var _this = this;
		camera3D = _this.contentWindow.camera;
		controls3D = _this.contentWindow.controls;
		this.contentWindow.controls.addEventListener('change', function () {
			if (roomImIn["moderator"] == ownSocketId) {
				var pos = camera3D.position;
				send3dPos([pos["x"], pos["y"], pos["z"], this.target.x, this.target.y, this.target.z]);
			}
		});
	});

	$("#control3DInfoModalBtn").click(function () {
		showModal({
			titleHTML: "Mouse Control Info",
			bodyHTML: "Left-click (hold) + move = rotate camera<br>" +
				"Right-click (hold) + move = move camera<br>" +
				"Mousewheel (scroll) = zoom (in and out)",
			okBtnText: "Ok",
			saveBtnText: "hide"
		});
	});


	$("#singleFileUploadForm").on('submit', function (e) {	//SingleFileUpload
		e.preventDefault();
		var formData = new FormData($(this)[0]);
		formData.append("userId", ownSocketId);
		formData.append("uploadType", "singleFileUpload");
		formData.append("room", roomImIn["roomName"]);

		sendFormData(formData, function (msg) {
			//success callback
			$("#singleFileUploadStatus").text("");
		}, function (err) {
			$("#newPraesiTable").show();
			$("#singleFileUploadStatus").text('Fehler: ' + err);
		}, function (progress) {
			$("#singleFileUploadStatus").text(progress + '%');
			//Upload progress
		}, function (progress) {
			//Download progress
		});
	});

	$(".praesiUpload").click(function (e) {
		e.preventDefault();
		$('#uploadPraesis').modal('show');
	});

	$(".3dObjUpload").click(function (e) {
		e.preventDefault();
		show3DManageModal();
	});

	$("#praesiUploadInput").change(function () {
		$("#praesiUpInfo").text("");
	});

	$(".praesiType").change(function () {
		$("#filePlaceholder").val("");
		$("#praesiUploadInput").val("");
		if ($(".praesiType:checked").val() == "revealPraesi") {
			$("#indexTr").show();
		} else {
			$("#indexTr").hide();
		}
	});

	$("#screenshareSource").change(function () {
		if ($(this).val() == 1) {
			$("#screenshareCamSelectTR").hide();
		} else {
			$("#screenshareCamSelectTR").show();
		}
	});

	$("#refreshScreenshareCamSelectBtn").click(function () {
		appendCamDevices();
	})

	$('#praseiUploadForm').on('submit', function (e) {	//PraesiUpload
		e.preventDefault();
		var FileInput = $("#praesiUploadInput");
		var files = FileInput[0].files;
		var praesiType = $(".praesiType:checked").val();

		if ($("#praesiName").val() == "") {
			$("#praesiName").val(cleanString($("#filePlaceholder").val()));
		}
		var praesiName = cleanString($("#praesiName").val());

		var formData = new FormData(this);
		formData.append("userId", ownSocketId);
		formData.append("uploadType", "praesi");
		formData.append("room", roomImIn["roomName"]);

		if (praesiName == "") {
			$("#praesiUpInfo").text("Name of presentation is missing!");
			return;
		}

		if (files.length <= 0 || $("#filePlaceholder").val() == "") {
			$("#praesiUpInfo").text("No file selected!");
			return;
		}

		if (praesiType == "revealPraesi") {
			if (files.length > 1) {
				$("#praesiUpInfo").text("Only one zip file is allowed (Reveal presentation)!");
				return;
			}
			var file = files[0];
			var filespilt = file.name.split(".");
			if (filespilt[filespilt.length - 1].toLowerCase() != "zip") {
				$("#praesiUpInfo").text("File must be a zip file!");
				return;
			}
		} else if (praesiType == "pdfPraesi") {
			if (files.length > 1) {
				$("#praesiUpInfo").text("Only one PDF file is allowed (PDF presentation)!");
				return;
			}
			var file = files[0];
			var filespilt = file.name.split(".");
			if (filespilt[filespilt.length - 1].toLowerCase() != "pdf") {
				$("#praesiUpInfo").text("File must be a pdf file!");
				return;
			}
		}

		$("#newPraesiTable").hide();
		sendFormData(formData, function (msg) {
			//success callback
			$("#praesiUpInfo").text('Upload completed!');
			$("#praesiName").val("");
			$("#filePlaceholder").val("")
			$("#newPraesiTable").show();
		}, function (err) {
			$("#newPraesiTable").show();
			$("#praesiUpInfo").text('Error: ' + err);
		}, function (progress) {
			$("#praesiUpInfo").text('Uploading... ' + progress + '%');
			//Upload progress
		}, function (progress) {
			//Download progress
		});
	});

	$("#inputProfilePic").change(function () {
		readProfileImage(this);
	});

	var profilePicTemp = null;
	function readProfileImage(input) {
		if (input.files && input.files[0]) {
			if (input.files[0].type.indexOf("image") === -1) {
				alert("Please choose an image!");
			} else if (input.files[0].size > 500000) {
				alert("Please choose an image less than 0.5MB!");
			} else {
				var FR = new FileReader();
				FR.onload = function (e) {
					$('#sProfilePic').attr("src", e.target.result);
					$('#profilePicForm').submit();
				};
				FR.readAsDataURL(input.files[0]);
			}
		}
	}

	$('#profilePicForm').on('submit', function (e) {	//PraesiUpload
		e.preventDefault();
		var formData = new FormData($(this)[0]);
		formData.append("userId", ownSocketId);
		formData.append("uploadType", "profilePic");
		formData.append("room", roomImIn["roomName"]);
		sendFormData(formData, function (msg) {
			//success callback
			$("#profilePicStatus").text("");
		}, function (err) {
			$("#profilePicStatus").text('Fehler: ' + err);
		}, function (progress) {
			$("#profilePicStatus").text(progress + '%');
			//Upload progress
		}, function (progress) {
			//Download progress
		});
	});

	$("#userPicUploadModal").on('shown.bs.modal', function (e) {
		profilePicTemp = "./img/dummypic.jpg";
		$("#sProfilePic").attr("src", profilePicTemp);
	});

	$("#changeProfilePicOkBtn").click(function () {
		$('#userPicUploadModal').modal('hide');
	});



	//Manage Toolbar
	$(".toolbar-icon").click(function () {
		var status = "";
		if ($(this).hasClass("alert-danger")) {
			$(this).removeClass("alert-danger");

			if ($(this).find(".mdi-av-volume-off").length > 0) {
				status = "not-silence";
				$.each($("audio"), function () {
					$(this).prop('muted', false);
				});
				refreshMuteUnmuteAll();
			} else if ($(this).find(".fa-bullhorn").length > 0) {
				status = "not-horn";
			} else if ($(this).find(".fa-thumbs-o-up").length > 0) {
				status = "not-thumbup";
			} else if ($(this).find(".fa-thumbs-o-down").length > 0) {
				status = "not-thumbdown";
			} else if ($(this).find(".fa-hand-o-up").length > 0) {
				status = "not-handup";
			} else if ($(this).find(".fa-coffee").length > 0) {
				status = "not-muted";
				sendUserStatus(status);
				status = "not-coffee";
			} else if ($(this).find(".applause").length > 0) {
				status = "not-applause";
			} else if ($(this).find(".fa-video-camera").length > 0) {
				stopLocalVideo();
			}
		} else {
			$(this).addClass("alert-danger");

			if ($(this).find(".mdi-av-volume-off").length > 0) {
				status = "silence";
				$.each($("audio"), function () {
					$(this).prop('muted', true);
				});
			} else if ($(this).find(".fa-bullhorn").length > 0) {
				status = "horn";
			} else if ($(this).find(".fa-thumbs-o-up").length > 0) {
				if ($(".fa-thumbs-o-down").parent("button").hasClass("alert-danger")) {
					$(".fa-thumbs-o-down").parent("button").click();
				}
				status = "thumbup";
			} else if ($(this).find(".fa-thumbs-o-down").length > 0) {
				if ($(".fa-thumbs-o-up").parent("button").hasClass("alert-danger")) {
					$(".fa-thumbs-o-up").parent("button").click();
				}
				status = "thumbdown";
			} else if ($(this).find(".fa-hand-o-up").length > 0) {
				status = "handup";
			} else if ($(this).find(".fa-coffee").length > 0) {
				status = "muted";
				sendUserStatus(status);
				status = "coffee";
			} else if ($(this).find(".applause").length > 0) {
				status = "applause";
			} else if ($(this).find(".fa-video-camera").length > 0) {
				if ($(this).hasClass("alert-error")) {
					$(this).removeClass("alert-error");
				}
				startLocalVideo();
			}
		}
		if (status != "")
			sendUserStatus(status)
	});

	$("#praesiToolbar").find("#praesiStart").click(function () {
		if (allLoadedPraesis && allLoadedPraesis[currentPraesiName]) {
			sendLoadSlide(allLoadedPraesis[currentPraesiName]["name"], 0);
		}
	});

	$("#praesiToolbar").find("#praesiBack").click(function () {
		praesiBack();
	});

	$("#praesiToolbar").find("#praesiNext").click(function () {
		praesiNext();
	});

	$("#praesiToolbar").find("#praesiENd").click(function () {
		if (allLoadedPraesis && allLoadedPraesis[currentPraesiName]) {
			if (allLoadedPraesis[currentPraesiName]["type"] == "picPraesi") {
				sendLoadSlide(allLoadedPraesis[currentPraesiName]["name"], allLoadedPraesis[currentPraesiName]["slides"].length - 1);
			} else if (allLoadedPraesis[currentPraesiName]["type"] == "pdfPraesi") {
				var l = getPDFPraesiSlideCount() - 1;
				sendLoadSlide(allLoadedPraesis[currentPraesiName]["name"], l);
			} else if (allLoadedPraesis[currentPraesiName]["type"] == "revealPraesi") {
				sendLoadSlide(allLoadedPraesis[currentPraesiName]["name"], revealObject.getTotalSlides());
			}
		}
	});

	$("#loadYoutubeBtn").click(function () {
		var url = $.trim($("#youtubeURLinput").val());
		if (url != "") {
			sendYoutubeCommand({ "key": "loadVideo", "data": url });
		}
	});

	var oldYTVolume = null;
	$("#youtubeVolumeSlider").on({
		slide: function () {
			var crntVol = $(this).val();
			if (oldYTVolume != crntVol) {
				setYoutubeVolume(crntVol);
			}
		}
	});

	$('.mainTab').on('click', function () {
		if (roomImIn["moderator"] == ownSocketId) {
			sendChangeTab($(this).attr("tabtarget"));
		}
	});

	$("#startSnake").click(function () {
		sendChatMsg("/snake");
	});

	/* - END - MAIN PAGE */
});
