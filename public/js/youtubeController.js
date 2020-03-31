var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var ytplayer = null;
var youtubeUrl = "";

function loadYoutubeVideo(url, moderator) {
	$("#ytapiplayer").empty();
	$("#ytapiplayer").html('<div id="theytPlayer"></div>');

	if(moderator) {
		$("#ytOverlay").hide();
	} else {
		$("#ytOverlay").show();
	}
	if(url.indexOf("https://")==-1)
		url = url.replace("http://","https://");
	url = url.replace("watch?v=", "v/");
	youtubeUrl = url;

	ytplayer = new YT.Player('theytPlayer', {
	width: 1100,
	height: 700,
	events: {
		  'onReady': onPlayerReady,
		  'onError': onYoutubeError,
		  'onStateChange': onytplayerStateChange,
		  'onError': onYoutubeError
		}
	});

	function onPlayerReady() {
		ytplayer.loadVideoByUrl(youtubeUrl, 0,"default");
		ytplayer.setVolume($("#youtubeVolumeSlider").val());
	}
}

var oldStatus = null;
function onytplayerStateChange(newState) {
	newState = newState.data;
    if(oldStatus != newState) {
    	console.log("send", newState);
   		sendYoutubeCommand({"key": "status", "data":newState, "time":getCurrentTimeYoutube()});
    }
   	oldStatus = newState;
}

function onYoutubeError(err) {
	console.log("Youtube Error:", err);
}

function playYoutube(time) {
	if(ytplayer != null) {
		ytplayer.seekTo(time);
		ytplayer.playVideo();
	}
}

function pauseYoutube() {
	if(ytplayer != null) {
		ytplayer.pauseVideo();
	}
}

function seekToYoutube(time) {
	if(ytplayer != null) {
		ytplayer.seekTo(time, false);
	}
}

function muteYoutube() {
	if(ytplayer != null) {
		ytplayer.mute();
	}
}

function unMuteYoutube() {
	if(ytplayer != null) {
		ytplayer.unMute();
	}
}

function getCurrentTimeYoutube() {
	if(ytplayer != null) {
		return ytplayer.getCurrentTime();
	}
}

function setYoutubeVolume(vol) {
	if(ytplayer != null) {
		ytplayer.setVolume(vol);
	}
}