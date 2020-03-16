var langDb = {
	"de" : {
		"remainingTime" : "Verbleibende Zeit: ",
		"timesup" : "Zeit abgelaufen ",
		"haveToBeModerator" : "Sie müssen Moderator sein um die Funktion zu benutzen ",
		"minutes" : "Minute(n) ",
		"seconds" : "Sekunde(n) ",
		"hours" : "Stunde(n) ",
		"noUserAvaliable" : "Kein Teilnehmer vorhanden ",
		"randomUser" : "Zufälliger Teilnehmer: ",
		"randomUserList" : "Zufällige Teilnehmerliste: ",
		"searchResult" : "Suchergebnis: "
	},
	"en" : {
		"remainingTime" : "Remaining time: ",
		"timesup" : "Times up ",
		"haveToBeModerator" : "You have to be moderator to use this function ",
		"minutes" : "Minutes ",
		"seconds" : "Second(s) ", 
		"hours" : "hour(s) ",
		"noUserAvaliable" : "No user available ",
		"randomUser" : "Random User: ", 
		"randomUserList" : "Random list of participants: ",
		"searchResult" : "Search Result: "
	}
}

function getLang(index) {
	if(userLang != "de") {
		userLang = "en";
	}
	if(langDb[userLang][index])
		return langDb[userLang][index];
	else
		return "lang not found for index:"+index;
}