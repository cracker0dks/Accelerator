//Manage Tour Steps!
var tourPartsDb = {
	"ThumbsUp": {
		element: "#ThumbsUp",
		title: "Daumen hoch",
		content: "Sie können diesen Button benutzen, um zu zeigen, wenn Sie etwas mögen",
		placement: "top"
	},
	"ThumbsUpEN": {
		element: "#ThumbsUp",
		title: "Thumbs Up",
		content: "You can use this button in order to show that you like something",
		placement: "top"
	},
	"ThumbsDown": {
		element: "#ThumbsDown",
		title: "Daumen runter",
		content: "Wenn Sie etwas nicht mögen und es den Anderen zeigen möchten, können Sie diesen Button verwenden",
		placement: "top"
	},
	"ThumbsDownEN": {
		element: "#ThumbsDown",
		title: "Thumbs Down",
		content: "You can use this button in order to show that you dislike something",
		placement: "top"
	},
	"handsUpBtn": {
		element: "#handsUpBtn",
		title: "sich melden",
		content: "Wenn Sie sich zu Wort melden wollen, benutzen Sie bitte diesen Button",
		placement: "top"
	},
	"handsUpBtnEN": {
		element: "#handsUpBtn",
		title: "Hands Up",
		content: "Click this button in order to put your hands up. If the moderator accepts, you will be able to speak",
		placement: "top"
	},
	"Clap": {
		element: ".fa-sign-language",
		title: "Klatschen",
		content: "Mit diesem Button können Sie virtuell klatschen",
		placement: "top"
	},
	"ClapEN": {
		element: ".fa-sign-language",
		title: "Clap",
		content: "Click this button in order to give a virtual clap",
		placement: "top"
	},
	"hornBtn": {
		element: "#hornBtn",
		title: "Das Horn",
		content: "Nach Klick auf diesen Button können Sie unmittelbar sprechen",
		placement: "top"
	},
	"hornBtnEN": {
		element: "#hornBtn",
		title: "The Horn",
		content: "Click the horn to enable your microfone",
		placement: "top"
	},
	"silenceBtn": {
		element: "#silenceBtn",
		title: "Stille",
		content: "Klicken Sie hier, um die Anderen stumm zu schalten",
		placement: "top"
	},
	"silenceBtnEN": {
		element: "#silenceBtn",
		title: "Silence",
		content: "Click here to silence others",
		placement: "top"
	},
	"afkBtn": {
		element: "#afkBtn",
		title: "Away from keyboard",
		content: "Wenn Sie Ihren Bildschirm verlassen und gerade nicht ansprechbar sind, zeigen Sie es doch den anderen mit der Kaffee-Tasse",
		placement: "top"
	},
	"afkBtnEN": {
		element: "#afkBtn",
		title: "Away from keyboard",
		content: "Click on this thing to mute yourself and show that you are away... ;)",
		placement: "top"
	},
	"moderatorDiv": {
		element: "#moderatorDiv",
		title: "Moderator",
		content: "Hier ist der Stuhl des Moderators. Ist dieser leer, können Sie diesen betreten, sofern Sie etwas präsentieren möchten",
		orphan: true
	},
	"moderatorDivEN": {
		element: "#moderatorDiv",
		title: "Moderator",
		content: "Here is the moderator of this room. If it's free you can click it to be moderator yourself and use more functions!",
		orphan: true
	},
	"userRightField": {
		element: ".UserRightTD",
		title: "Moderator",
		content: "In der Rolle des Moderators können Sie Teilnehmern Rederecht per Klick auf deren Mikrofon geben - oder einen Teilnehmer gar als Nachfolge-Moderator bestimmen",
		orphan: true
	},
	"userRightFieldEN": {
		element: ".UserRightTD",
		title: "Moderator",
		content: "When you are moderator, you can give a participant of your choice the microphone or even put him into the role of moderator!",
		orphan: true
	},
	"startSnake": {
		element: "#startSnake",
		title: "'Snake' spielen",
		content: "Klicken Sie hier, um Snake zu starten",
		placement: "top"
	},
	"startSnakeEN": {
		element: "#startSnake",
		title: "play the game 'Snake'",
		content: "Click here in order to play Snake!",
		placement: "top"
	},
	"showNotes": {
		element: "#showNotes",
		title: "Notizen",
		content: "Klicken Sie hier, um das Notizfeld ein- oder auszublenden",
		placement: "top"
	},
	"showNotesEN": {
		element: "#showNotes",
		title: "Notes",
		content: "Click here in order to enable/disable the notes!",
		placement: "top"
	},
	"showFiles": {
		element: "#showFiles",
		title: "Dateien / Cloud",
		content: "Klicken Sie hier, um die Dateien in der Cloud zu zeigen oder auszublenden",
		placement: "left"
	},
	"showFilesEN": {
		element: "#showFiles",
		title: "Files / Cloud",
		content: "Click here in order to show/hide the files from Cloud!",
		placement: "left"
	},
	"LogoutBtn": {
		element: "#logoutBtn",
		title: "Logout",
		content: "Hier können Sie sich aus dem aktuellen Raum ausloggen",
		placement: "right"
	},
	"LogoutBtnEN": {
		element: "#logoutBtn",
		title: "Logout",
		content: "Here you can logout from the current room",
		placement: "right"
	},
	"ChatInputDiv": {
		element: "#chatInputWrapper",
		title: "Chat",
		content: "Schreiben Sie hier eine Chatnachricht an Alle",
		placement: "top"
	},
	"ChatInputDivEN": {
		element: "#chatInputWrapper",
		title: "Chat",
		content: "Type in a chat message to all",
		placement: "top"
	},
	"SmilieSvg": {
		element: "#smilieSvg",
		title: "Emoticons",
		content: "Fügen Sie Smileys/Emoticons zu Ihren Nachrichten hinzu",
		placement: "top"
	},
	"SmilieSvgEN": {
		element: "#smilieSvg",
		title: "Emoticons",
		content: "Add Emoticons to your chat message",
		placement: "top"
	},
	"chatButtonWrapperBtn": {
		element: "#chatButtonWrapper",
		title: "Nachricht senden",
		content: "Hiermit senden Sie eine Chatnachricht raus",
		placement: "left"
	},
	"chatButtonWrapperBtnEN": {
		element: "#chatButtonWrapper",
		title: "Send Message",
		content: "Send out your message",
		placement: "left"
	},
	"toggleFullscreen": {
		element: "#toggle_fullscreen",
		title: "Vollbild",
		content: "Nach Klick auf diesen Button genießen Sie die Präsentation im Vollbild",
		placement: "left"
	},
	"toggleFullscreenEN": {
		element: "#toggle_fullscreen",
		title: "Fullscreen",
		content: "See the presentation in fullscreen",
		placement: "left"
	},
	"ColorChange": {
		element: ".colorPicker",
		title: "Farbe ändern",
		content: "Hier können Sie Ihre eigene Farbe wählen, die Sie vor allem bei Interaktionen zu Ihren Änderungen zuordnet",
		placement: "right"
	},
	"ColorChangeEN": {
		element: ".colorPicker",
		title: "Change your colour",
		content: "Pick any other colour by clicking on this colour bar",
		placement: "right"
	},
	"ChangePicture": {
		element: ".userIcon",
		title: "Profilbild",
		content: "Ändern Sie hier Ihr Anzeigebild. Sie können ein Bild mit maximal 0.5 MB von Ihrer Festplatte hinzufügen",
		placement: "right"
	},
	"ChangePictureEN": {
		element: ".userIcon",
		title: "Change your Icon",
		content: "Change your picture. You can upload any picture from your computer. Maximum: 0.5 MB",
		placement: "right"
	},
	"Webcam": {
		element: ".shareOwnVideo",
		title: "Webcam",
		content: "Zeigen Sie sich den Anderen über Webcam",
		placement: "right"
	},
	"WebcamEN": {
		element: ".shareOwnVideo",
		title: "Webcam",
		content: "Show yourself via Webcam to others",
		placement: "right"
	},
	"ChangePlace": {
		element: ".changePlace",
		title: "Moderator wechseln",
		content: "Hier können Sie den Moderator-Stuhl verlassen oder einen Nachfolge-Moderator bestimmen",
		placement: "right"
	},
	"ChangePlaceEN": {
		element: ".changePlace",
		title: "Switch moderator",
		content: "Go back into the role of a participant or pick a special person to be the next moderator",
		placement: "right"
	},
	"uservolume": {
		element: ".userVolume",
		title: "Ihr Audiosignal",
		content: "Wenn Ihr Mikrofon richtig konfiguriert ist und Sie Rederecht haben, sollten Sie hier einen Ausschlag sehen, sobald Sie sprechen",
		placement: "right"
	},
	"uservolumeEN": {
		element: ".userVolume",
		title: "Your audio signal",
		content: "If your microphone is set up correctly, the symbol will show when you speak",
		placement: "right"
	},
	"mictospeak": {
		element: ".fa-microphone",
		title: "Mikrofon",
		content: "Wenn Sie Moderator sind, können Sie Mikrofone von Teilnehmern per Klick blau markieren, damit diese Rederecht haben",
		placement: "right"
	},
	"mictospeakEN": {
		element: ".fa-microphone",
		title: "Microphone",
		content: "The moderator can click on this symbol in order to give you speaking permission. When one has speaking permission, the microphone will change the colour to blue",
		placement: "right"
	},
	"HomeBtn": {
		element: ".fa-home",
		title: "Startbildschirm",
		content: "Zeigen Sie den Startbildschirm des Accelerators",
		placement: "bottom"
	},
	"HomeBtnEN": {
		element: ".fa-home",
		title: "Homescreen",
		content: "Show Homescreen to your participants",
		placement: "bottom"
	},
	"showPresentation": {
		element: "#showPresentation",
		title: "Präsentationsmodus",
		content: "Zeigen Sie Ihre Präsentation an alle Teilnehmer",
		placement: "bottom"
	},
	"showPresentationEN": {
		element: "#showPresentation",
		title: "presentation mode",
		content: "Share your presentation to your participants",
		placement: "bottom"
	},
	"show3dObject": {
		element: "#show3d",
		title: "3D-Object",
		content: "Zeigen Sie Ihre 3D-Objekte an alle Teilnehmer",
		placement: "bottom"
	},
	"show3dObjectEN": {
		element: "#show3d",
		title: "3D-object",
		content: "Share your 3D Object to your participants",
		placement: "bottom"
	},
	"CollabTextEditor": {
		element: "#etherpadBtn",
		title: "Kollaborativer Text-Editor",
		content: "Klicken Sie hier, um den kollaborativen Text-Editor zu öffnen",
		placement: "bottom"
	},
	"CollabTextEditorEN": {
		element: "#etherpadBtn",
		title: "Collaborative Text Editor",
		content: "Click here to open a collaborative text editor for you and your participants",
		placement: "bottom"
	},
	"YoutubeBtn": {
		element: "#youtubeBtn",
		title: "Youtube Video",
		content: "Zeigen Sie hiermit Ihren Teilnehmern ein Youtube-Video",
		placement: "bottom"
	},
	"YoutubeBtnEN": {
		element: "#youtubeBtn",
		title: "Youtube Video",
		content: "Show a youtube video to your participants",
		placement: "bottom"
	},
	"whiteboardTabBtn": {
		element: "#whiteboardTabBtn",
		title: "Whiteboard",
		content: "Öffnen Sie ein Whiteboard, das kollaborativ editiert werden kann",
		placement: "bottom"
	},
	"whiteboardTabBtnEN": {
		element: "#whiteboardTabBtn",
		title: "Whiteboard",
		content: "Open a Whiteboard for collaborative editing",
		placement: "bottom"
	},
	"screenShareTabBtn": {
		element: "#screenShareTabBtn",
		title: "Screenshare",
		content: "Teilen Sie Ihren Bildschirm mit den Teilnehmern",
		placement: "bottom"
	},
	"screenShareTabBtnEN": {
		element: "#screenShareTabBtn",
		title: "Screenshare",
		content: "Share your screen to your participants",
		placement: "bottom"
	},
	"praesiControl": {
		element: "#praesicontrol",
		title: "Präsentations-Verwaltung",
		content: "Klicken Sie hier, um Ihre Präsentation(en) zu verwalten",
		placement: "bottom"
	},
	"praesiControlEN": {
		element: "#praesicontrol",
		title: "Presentation control",
		content: "Click here to manage your presentations",
		placement: "bottom"
	},
	"3dObjectControl": {
		element: "#3dObjectControl",
		title: "3D-Objekt-Verwaltung",
		content: "Klicken Sie hier, um Ihre 3D-Objekte zu verwalten",
		placement: "bottom"
	},
	"3dObjectControlEN": {
		element: "#3dObjectControl",
		title: "3D-Object control",
		content: "Click here to manage your 3D-Objects",
		placement: "bottom"
	},
	"praesiStart": {
		element: "#praesiStart",
		title: "Erste Folie",
		content: "Gehen Sie zur ersten Folie Ihrer Präsentation",
		placement: "bottom"
	},
	"praesiStartEN": {
		element: "#praesiStart",
		title: "First Slide",
		content: "Go back to the first slide of your presentation",
		placement: "bottom"
	},
	"praesiBack": {
		element: "#praesiBack",
		title: "Eine Folie zurück",
		content: "Gehen Sie eine Folie zurück",
		placement: "bottom"
	},
	"praesiBackEN": {
		element: "#praesiBack",
		title: "One slide back",
		content: "Go one slide back",
		placement: "bottom"
	},
	"praesiNext": {
		element: "#praesiNext",
		title: "Eine Folie vorwärts",
		content: "Gehen Sie eine Folie vorwärts",
		placement: "bottom"
	},
	"praesiNextEN": {
		element: "#praesiNext",
		title: "One slide forward",
		content: "Go one slide forward",
		placement: "bottom"
	},
	"praesiENd": {
		element: "#praesiENd",
		title: "Letzte Folie",
		content: "Gehen Sie zur letzten Folie Ihrer Präsentation",
		placement: "bottom"
	},
	"praesiENdEN": {
		element: "#praesiENd",
		title: "Last Slide",
		content: "Go forward to the last slide of your presentation",
		placement: "bottom"
	},
	"praesiCursorBtn": {
		element: "#praesiCursorBtn",
		title: "Mauszeiger ein-/ausblenden",
		content: "Zeigen oder Verstecken Sie Ihren Mauszeiger durch Klick auf diesen Button",
		placement: "bottom"
	},
	"praesiCursorBtnEN": {
		element: "#praesiCursorBtn",
		title: "Mouse enable/disable",
		content: "Enable/Disable to show mouse to the participants",
		placement: "bottom"
	},
	"praesiZoomBtn": {
		element: "#praesiZoomBtn",
		title: "Zoom",
		content: "Schalten Sie den Präsentationszoom an oder aus",
		placement: "bottom"
	},
	"praesiZoomBtnEN": {
		element: "#praesiZoomBtn",
		title: "Zoom",
		content: "Enable/Disable zoom at mouseover on presentation",
		placement: "bottom"
	},
	"userTootlsBtn": {
		element: "#userTootlsBtn",
		title: "UserItems",
		content: "Aktivieren oder Deaktivieren sie die UserItems (von den Teilnehmern generierte Inhalte, wie beispielsweise beschriebenen Textfelder)",
		placement: "bottom"
	},
	"userTootlsBtnEN": {
		element: "#userTootlsBtn",
		title: "User Items",
		content: "Enable/Disable UserItems (such as text fields) for your participants",
		placement: "bottom"
	},
	"userRemoveUserPItemsBtn": {
		element: "#userRemoveUserPItemsBtn",
		title: "Papierkorb",
		content: "Löschen Sie alle von den Teilnehmern generierte UserItems (wie beispielsweise die Textfelder)",
		placement: "bottom"
	},
	"userRemoveUserPItemsBtnEN": {
		element: "#userRemoveUserPItemsBtn",
		title: "Bin",
		content: "Remove all generated UserItems (such as text fields)",
		placement: "bottom"
	},
	"endTour": {
		element: "#logogrossImg",
		title: "Ende",
		content: "Sie haben erfolgreich die Tour beendet. Klicken Sie auf 'next' oder 'End tour' um die Tour zu beenden",
		orphan: true,
		placement: "left"
	},
	"endTourEN": {
		element: "#logogrossImg",
		title: "End",
		content: "Tour done. Have fun! Click 'next' or 'End tour' to end the tour!",
		orphan: true,
		placement: "left"
	}
}

for (var i in tourPartsDb) {
	tourPartsDb[i]["name"] = i;
}

//Manage Tours!
var toursDb = {
	"introBasicTour": [
		// tourPartsDb["ThumbsUp"],
		// tourPartsDb["ThumbsDown"],
		// tourPartsDb["handsUpBtn"],
		// tourPartsDb["Clap"],
		tourPartsDb["hornBtn"],
		tourPartsDb["silenceBtn"],
		tourPartsDb["afkBtn"],
		tourPartsDb["moderatorDiv"],
		// tourPartsDb["startSnake"],
		// tourPartsDb["showNotes"],
		// tourPartsDb["showFiles"],
		// tourPartsDb["LogoutBtn"],
		// tourPartsDb["ChatInputDiv"],
		// tourPartsDb["SmilieSvg"],
		// tourPartsDb["chatButtonWrapperBtn"],
		// tourPartsDb["toggleFullscreen"],
		// tourPartsDb["ColorChange"],
		// tourPartsDb["ChangePicture"],
		// tourPartsDb["Webcam"],
		// tourPartsDb["ChangePlace"],
		// tourPartsDb["uservolume"],
		// tourPartsDb["mictospeak"],
		// tourPartsDb["HomeBtn"],
		// tourPartsDb["showPresentation"],
		// tourPartsDb["show3dObject"],
		// tourPartsDb["CollabTextEditor"],
		// tourPartsDb["YoutubeBtn"],
		// tourPartsDb["whiteboardTabBtn"],
		// tourPartsDb["screenShareTabBtn"],
		// tourPartsDb["praesiControl"],
		// tourPartsDb["3dObjectControl"],
		// tourPartsDb["praesiStart"],
		// tourPartsDb["praesiBack"],
		// tourPartsDb["praesiNext"],
		// tourPartsDb["praesiENd"],
		// tourPartsDb["praesiCursorBtn"],
		// tourPartsDb["praesiZoomBtn"],
		// tourPartsDb["userTootlsBtn"],
		// tourPartsDb["userRemoveUserPItemsBtn"],
		tourPartsDb["endTour"]
	]
};

function showTour(tourname, forceStart) { //forceStart=true -> Start it even if it was shown already
	var tourData = toursDb[tourname];
	console.log(tourData)
	var tour = new Tour({
		storage: false,
		name: tourname,
		steps: tourData,
		template: "<div class='popover tour'>" +
			"<div class='arrow'></div>" +
			"<h3 class='popover-title'></h3>" +
			"<div class='popover-content'></div>" +
			"<button style='background: gray; padding: 5px 10px 5px 10px; margin-left:10px;' class='btn btn-default' data-role='prev'>« Prev</button>" +
			"<button style='background: gray; padding: 5px 10px 5px 10px;' class='btn btn-default' data-role='next'>Next »</button><br>" +
			"<button style='float: right; margin-right: 15px; background: gray; padding: 7px 15px 7px 15px;' class='btn btn-default' data-role='end'>End tour</button>" +
			"</div>",
	});
	tour.init();
	if (forceStart)
		tour.start(true);
	else
		tour.start();
}

function showSingleTourStep(stepname) {
	var t = [tourPartsDb[stepname], tourPartsDb[stepname]]; //Because of tour bug on tours with only one element
	var tour = new Tour({
		name: stepname,
		steps: t,
		template: "<div class='popover tour'>" +
			"<div class='arrow'></div>" +
			"<h3 class='popover-title'></h3>" +
			"<div class='popover-content'></div>" +
			"<button style='float: right; margin-right: 15px; background: gray; padding: 7px 15px 7px 15px;' class='btn btn-default' data-role='end'>Ok</button>" +
			"</div>",
	});
	tour.init();
	tour.start(true);
}