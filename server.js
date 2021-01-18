/**************/
/*** CONFIG ***/
/**************/
//@ts-check
"use strict";
var yauzl = require("yauzl");
var formidable = require('formidable');
var http = require('http');
var exec = require('child_process').exec;
var configLoader = require('./configLoader.js');
var config = configLoader.getConfigs();

var httpPort = config["http"]["port"] || 8080;

var express = require('express');
var fs = require("fs-extra");

const createDOMPurify = require("dompurify"); //Prevent xss
const { JSDOM } = require("jsdom");
const window = new JSDOM("").window;
// @ts-ignore
const DOMPurify = createDOMPurify(window);

var snake = require("./acc_server_modules/snake/snake.js");
var s_whiteboard = require("./acc_server_modules/whiteboard/s_whiteboard.js");
var app = express();

if (config["mcuConfig"]["isMaster"]) {
    app.use(express.static(__dirname + '/public'));
} else {  //dont expose main page on loadbalancer
    var lbReturnString = 'This is a loadbalancer!'
    app.get('/', function (req, res) { res.send(lbReturnString); });
    app.get('/index.html', function (req, res) { res.send(lbReturnString); });
}

var server = http.createServer({

}, app).listen(httpPort);

var io = require('socket.io').listen(server, {
    pingTimeout: 10000,
    pingInterval: 25000
});

config["mcuConfig"]["masterPort"] = httpPort;
var ezMCU = require('./acc_server_modules/ezMCU/s_ezMCUsignaling').init(io, config["mcuConfig"]);

console.log("Webserver & socketserver running on port:" + httpPort);

fs.ensureDir('./public/profilePics/').catch(err => {
    console.log("ERROR: Cant create folder: ./public/profilePics/");
});

fs.ensureDir('./public/singlefiles/').catch(err => {
    console.log("ERROR: Cant create folder: ./public/singlefiles/");
});

fs.ensureDir('./db').catch(err => {
    console.log("ERROR: Cant create folder: ./public/singlefiles/");
})

exec("unoconv --listener", { cwd: "./public/praesis/" }, function (error, stdout, stderr) { //Init unoconv
    if (error) {
        console.log("Warning: unoconv not found! If you are on Dev, this is not a problem!");
    }
})

app.post('/upload', function (req, res) { //File upload
    var form = new formidable.IncomingForm(); //Receive form
    var formData = {
        files: {},
        fields: {}
    }
    // form.on('progress', function(bytesReceived, bytesExpected) {
    //     //(100*(bytesReceived/bytesExpected))
    // });

    form.on('file', function (name, file) {
        formData["files"][file.name] = file;
    });

    form.on('field', function (name, value) {
        formData["fields"][name] = value;
    });

    form.on('error', function (err) {
        console.log('File uplaod Error!');
    });

    form.on('end', function () {
        progressUploadFormData(formData);
        res.send("done");
        //End file upload
    });
    form.parse(req);
});

app.get('/loadwhiteboard', function (req, res) {
    var wid = req["query"]["wid"];
    var ret = s_whiteboard.loadStoredData(wid);
    res.send(ret);
    res.end();
});

function trim(str) {
    if (typeof (str) == "string") {
        return str.trim();
    }
    console.log(str, "not a String to trim...");
    return "";
}

var allRoomAttr = {};
var allSockets = {};
var allUserAttr = {};
var allPraesis = {};
var currentLoadedPraesis = {};
var currentLoadedTab = {};
var isUserPItemsLoaded = {};
var allSingleFiles = {};
var userPItems = {};
var all3DObjs = {};
var url3dObjs = {};
var storedYoutubePlays = {};

setTimeout(function () {
    console.log("--------------------------------------");
    if (config["mcuConfig"]["isMaster"]) {
        console.log("Accelerator MAIN is up and running! YEAH :D");
    } else {
        console.log("Accelerator Loadbalancer is up and running! YEAH :D");
    }
    console.log("--------------------------------------");
}, 200);


/*************************/
/*** INTERESTING STUFF ***/
/*************************/

io.sockets.on('connection', function (socket) {
    allSockets[socket.id] = socket;
    var userdata = { "id": socket.id, "username": "" };
    allUserAttr[socket.id] = userdata;

    var roomName = null;
    console.log("[" + socket.id + "] connection accepted");
    socket.on('disconnect', async function () {
        console.log("[" + socket.id + "] disconnected");

        sendToHoleRoom(roomName, 'removePeer', socket.id);

        if (typeof (allRoomAttr[roomName]) != "undefined" && allRoomAttr[roomName]["moderator"] == socket.id) {
            allRoomAttr[roomName]["moderator"] = "0";
            sendToHoleRoom(roomName, 'setModerator', "0");
        }
        delete allSockets[socket.id];
        if (allRoomAttr[roomName] && allRoomAttr[roomName]["users"]) {
            delete allRoomAttr[roomName]["users"][socket.id];
            var cleanRooms = getAllRoomsWithoutPasswords();
            socket.broadcast.emit('getAllRooms', cleanRooms);
            saveUserPItems();
            snake.startStopSnake(socket.id, roomName, false);
        }
    });

    socket.on('getAllRooms', function () {
        var cleanRooms = getAllRoomsWithoutPasswords();
        socket.emit('getAllRooms', cleanRooms);
    });

    socket.on('deleteRoom', function (content, callback) {
        var roomName = content.roomName;
        var creator = allRoomAttr[roomName].creator;

        if (creator == userdata["username"]) {
            var userCnt = 0;
            for (var i in allRoomAttr[roomName]["users"]) {
                userCnt++;
            }
            if (userCnt == 0) {
                deleteRoom(roomName);
                var cleanRooms = getAllRoomsWithoutPasswords();
                socket.broadcast.emit('getAllRooms', cleanRooms);
                socket.emit('getAllRooms', cleanRooms);
                saveAllRoomAttr();
            } else {
                callback("Room is not empty!");
            }
        } else {
            callback("Insufficient permissions!");
        }
    });

    socket.on('createRoom', function (content, callback) {
        content = escapeAllContentStrings(content);
        var roomName = content.roomName.trim();
        if(roomName == "") {
            return callback("Invaild Roomname!")
        }
        var roomPassword = content.roomPassword;
        var creator = content.creator;

        if (!allRoomAttr[roomName]) {
            allRoomAttr[roomName] = {
                "moderator": null,
                "users": {},
                "roomName": roomName,
                "roomPassword": roomPassword,
                "creator": creator,
                "lastVisit": +new Date(),
                "permanent": false
            }
            var cleanRooms = getAllRoomsWithoutPasswords();
            socket.broadcast.emit('getAllRooms', cleanRooms);
            socket.emit('getAllRooms', cleanRooms);
            saveAllRoomAttr();
        } else {
            callback("A room with this name already exists!")
        }
    });

    socket.on('setUserAttr', function (content, callback) {
        content = escapeAllContentStrings(content);
        var username = content["username"];
        var password = content["passwort"];
        var userLang = content["userLang"];
        userdata["username"] = username;
        userdata["userLang"] = userLang + '-' + userLang.toUpperCase();
        // checkUserNameAndPassword(username, password, function(trueFalse) {
        // });
        callback(config["accConfig"]);
    });

    socket.on('join', function (content, callback) {
        content = escapeAllContentStrings(content);
        //console.log("[" + socket.id + "] join ", content);
        roomName = content.roomName ? content.roomName.trim() : "";
        var roomPassword = content.roomPassword;

        if (!allRoomAttr[roomName]) {
            return callback("Not a vaild roomname!");
        }
        if (allRoomAttr[roomName]["roomPassword"] != "" && allRoomAttr[roomName]["roomPassword"] != roomPassword) {
            return callback("Wrong room password!");
        }

        userdata["username"] = content.username;
        userdata["socketId"] = socket.id;
        userdata["color"] = content.color;

        allRoomAttr[roomName]["users"] = allRoomAttr[roomName]["users"] ? allRoomAttr[roomName]["users"] : {};
        allRoomAttr[roomName]["users"][socket.id] = userdata;
        allRoomAttr[roomName]["lastVisit"] = +new Date();

        socket.join(roomName);

        var cleanRooms = getAllRoomsWithoutPasswords();
        socket.broadcast.emit('getAllRooms', cleanRooms);
        socket.emit('getAllRooms', cleanRooms);

        if (!currentLoadedTab[roomName]) {
            currentLoadedTab[roomName] = "#homeScreen";
        }
        //Send allPraesis in this room
        socket.emit('loadPraesis', allPraesis[roomName]);
        //Send all singleFiles in this room
        socket.emit('sigleFilesTable', allSingleFiles[roomName]);

        if (all3DObjs[roomName])
            socket.emit('load3DObjs', all3DObjs[roomName]);

        if (url3dObjs[roomName])
            socket.emit('show3DObj', url3dObjs[roomName]);

        var clients = io.sockets.adapter.rooms[roomName].sockets;
        for (var i in clients) {
            socket.emit('addPeer', allUserAttr[i]);
        }

        if (currentLoadedTab[roomName]) {
            var items = userPItems[roomName] ? userPItems[roomName][currentLoadedTab[roomName]] : null;

            setTimeout(function () { //Change tab with delay to load everything in first
                socket.emit('changeTab', { "tab": currentLoadedTab[roomName], "userPItems": items });
            }, 1000)

            if (storedYoutubePlays[roomName]) {
                socket.emit('youtubeCommand',
                    {
                        "key": "loadVideo",
                        "data": storedYoutubePlays[roomName].url,
                        "time": storedYoutubePlays[roomName].time,
                        "status": storedYoutubePlays[roomName].status
                    }
                )
            }
        }

        if (isUserPItemsLoaded[roomName]) {
            socket.emit('showHideUserPItems', isUserPItemsLoaded[roomName]);
        }

        if (currentLoadedPraesis[roomName]) {
            socket.emit('loadSlide', currentLoadedPraesis[roomName]); //Load prasei after leaving room
        }

        //For chat and mgs in the same room
        socket.on('message', function (msg) {
            msg = escapeAllContentStrings(msg);
            if (typeof (msg) == "string") {
                sendToHoleRoomButNotMe(roomName, socket.id, 'message', { "msg": msg, "id": socket.id, "username": userdata["username"] });
            } else if (isModerator()) {
                var newMsg = msg.msg;
                var changendUserName = msg.changedName;
                sendToHoleRoom(roomName, 'message', { "msg": newMsg, "id": socket.id, "username": changendUserName });
            }
        });

        //users is ready to talk, tell others to add him now
        socket.on('connectionReady', function () {
            sendToHoleRoomButNotMe(roomName, socket.id, 'addPeer', userdata);
        });

        socket.on('setStatus', function (status) {
            status = escapeAllContentStrings(status);
            if (typeof (userdata["stadien"]) == "undefined") {
                userdata["stadien"] = {};
            }
            var statKey = status.split("-");
            if (statKey.length >= 2) {
                userdata["stadien"][statKey[1]] = status;
            } else {
                userdata["stadien"][statKey[0]] = status;
            }
            sendToHoleRoom(roomName, 'setStatus', { "id": socket.id, "status": status });
        });

        socket.on('setModerator', function (socketIdToSet) {
            socketIdToSet = escapeAllContentStrings(socketIdToSet);
            if (!allRoomAttr[roomName]["moderator"] || allRoomAttr[roomName]["moderator"] == "0" || (allRoomAttr[roomName]["moderator"] == socket.id && socket.id != socketIdToSet)) {
                allRoomAttr[roomName]["moderator"] = socketIdToSet;
                sendToHoleRoom(roomName, 'setModerator', socketIdToSet);
                delete storedYoutubePlays[roomName];
            }
        });

        socket.on('setGetMicToUser', function (data) {
            data = escapeAllContentStrings(data);
            if (isModerator() || (data["userid"] == socket.id && data["mic"] == "not-mic")) { //Only allow moderator or removing own mic
                sendToHoleRoom(roomName, 'setGetMicToUser', data);

                //Save mic state
                allUserAttr[data["userid"]]["mic"] = data["mic"];
            }
        });

        socket.on('loadPraesis', function (n) {
            sendToHoleRoom(roomName, 'loadPraesis', allPraesis[roomName]);
        });

        socket.on('addShowFileAsPresentation', function (filename) {
            var praesiName = filename.replace(/[^a-zA-Z0-9 ]/g, "");
            var content = {
                "name": praesiName,
                "slideid": 0
            }
            if (!allPraesis[roomName] || !allPraesis[roomName][praesiName]) {
                var path = "./public/praesis/" + roomName.split("###")[0] + "/" + praesiName

                fs.ensureDir(path, function (err) {
                    if (err) {
                        console.error(err);
                        removePraesi(praesiName, roomName);
                        return;
                    }
                    fs.createReadStream("./public/singlefiles/" + filename).pipe(fs.createWriteStream(path + '/' + filename));

                    allPraesis[roomName] = allPraesis[roomName] ? allPraesis[roomName] : {};
                    allPraesis[roomName][praesiName] = {
                        "name": praesiName,
                        "type": "pdfPraesi",
                        "filename": filename
                    };
                    sendToHoleRoom(roomName, 'loadPraesis', allPraesis[roomName]);

                    currentLoadedPraesis[roomName] = content;
                    sendToHoleRoom(roomName, 'loadSlide', content);
                    saveAllPraesis();
                });
            } else {
                currentLoadedPraesis[roomName] = content;
                sendToHoleRoom(roomName, 'loadSlide', content);
            }
        });

        socket.on('deletePraesi', function (name) {
            if (isModerator()) {
                removePraesi(name, roomName);
                delete allPraesis[roomName][name];
                delete currentLoadedPraesis[roomName];
                saveAllPraesis();
                if (userPItems[roomName] && userPItems[roomName][currentLoadedTab[roomName]]) {
                    var i = userPItems[roomName][currentLoadedTab[roomName]].length;
                    while (i--) {
                        if (userPItems[roomName][currentLoadedTab[roomName]][i]["praesiname"] == name) {
                            userPItems[roomName][currentLoadedTab[roomName]].splice(i, 1);
                        }
                    }
                }
                sendToHoleRoom(roomName, 'loadPraesis', allPraesis[roomName]);
            }
        });

        socket.on('loadSlide', function (content) {
            content = escapeAllContentStrings(content);
            if (isModerator()) {
                currentLoadedPraesis[roomName] = content;
                sendToHoleRoom(roomName, 'loadSlide', content);
            }
        });

        socket.on('revealSlideKey', function (keycode) {
            if (isModerator()) {
                sendToHoleRoom(roomName, 'revealSlideKey', keycode);
            }
        });

        socket.on('cursorPosition', function (content) {
            content = escapeAllContentStrings(content);
            if (isModerator()) {
                sendToHoleRoom(roomName, 'cursorPosition', content);
            }
        });

        socket.on('addUserPItem', function (content) {
            content = escapeAllContentStrings(content);
            content["userId"] = socket.id;
            if (!userPItems[roomName]) {
                userPItems[roomName] = {};
            }
            if (!userPItems[roomName][currentLoadedTab[roomName]]) {
                userPItems[roomName][currentLoadedTab[roomName]] = [];
            }
            userPItems[roomName][currentLoadedTab[roomName]].push(content);
            sendToHoleRoom(roomName, 'addUserPItem', content);
        });

        socket.on('changeUserPItemPosition', function (content) {
            content = escapeAllContentStrings(content);
            if (isModerator() || socket.id == content.userId || userdata.username == content.itemUsername) {
                sendToHoleRoom(roomName, 'changeUserPItemPosition', content);
            }
        });

        socket.on('fixPItemPosition', function (content) {
            content = escapeAllContentStrings(content);
            if (isModerator() || socket.id == content.userId || userdata.username == content.itemUsername) {
                if (currentLoadedTab[roomName] && userPItems[roomName] && userPItems[roomName][currentLoadedTab[roomName]]) {
                    for (var i = 0; i < userPItems[roomName][currentLoadedTab[roomName]].length; i++) {
                        if (userPItems[roomName][currentLoadedTab[roomName]][i]["itemId"] == content["itemId"]) {
                            userPItems[roomName][currentLoadedTab[roomName]][i]["posX"] = content["posX"];
                            userPItems[roomName][currentLoadedTab[roomName]][i]["posY"] = content["posY"];
                            sendToHoleRoom(roomName, 'updateUserPItem', userPItems[roomName][currentLoadedTab[roomName]][i]);
                            return;
                        }
                    }
                }
            }
        });

        socket.on('removeUserPItem', function (content) {
            content = escapeAllContentStrings(content);
            if (isModerator() || socket.id == content.userId || userdata.username == content.itemUsername) {
                for (var i = 0; i < userPItems[roomName][currentLoadedTab[roomName]].length; i++) {
                    if (userPItems[roomName][currentLoadedTab[roomName]][i]["itemId"] == content["itemId"]) {
                        sendToHoleRoom(roomName, 'removeUserPItem', content);
                        userPItems[roomName][currentLoadedTab[roomName]].splice(i, 1);
                        return;
                    }
                }
            }
        });

        socket.on('removeAllUserPItems', function (content) {
            content = escapeAllContentStrings(content);
            if (isModerator()) {
                sendToHoleRoom(roomName, 'removeAllUserPItems', content);
                if (userPItems[roomName]) {
                    if (content) {
                        var currentPraesiName = content["currentPraesiName"];
                        var currentPraesiSlide = content["currentPraesiSlide"];
                        var i = userPItems[roomName][currentLoadedTab[roomName]].length;
                        while (i--) {
                            if (userPItems[roomName][currentLoadedTab[roomName]][i]["praesiname"] == currentPraesiName && userPItems[roomName][currentLoadedTab[roomName]][i]["praesislide"] == currentPraesiSlide) {
                                userPItems[roomName][currentLoadedTab[roomName]].splice(i, 1);
                            }
                        }
                    } else if (roomName && currentLoadedTab[roomName] && userPItems[roomName][currentLoadedTab[roomName]]) {
                        var i = userPItems[roomName][currentLoadedTab[roomName]].length;
                        while (i--) {
                            if (!userPItems[roomName][currentLoadedTab[roomName]][i]["praesiname"] || !userPItems[roomName][currentLoadedTab[roomName]][i]["praesislide"]) {
                                userPItems[roomName][currentLoadedTab[roomName]].splice(i, 1);
                            }
                        }
                    }
                }
            }
        });

        socket.on('showHideUserPItems', function (content) {
            content = escapeAllContentStrings(content);
            if (isModerator()) {
                isUserPItemsLoaded[roomName] = content;
                sendToHoleRoom(roomName, 'showHideUserPItems', content);
            }
        });

        socket.on('youtubeCommand', function (content) {
            content = escapeAllContentStrings(content);
            if (isModerator()) {
                sendToHoleRoom(roomName, 'youtubeCommand', content);
                if (content.key == "status" && storedYoutubePlays[roomName]) {
                    var ytInterval = null;
                    if (content.data == 1) { //play
                        storedYoutubePlays[roomName].time = content.time;
                        ytInterval = setInterval(function () {
                            if (storedYoutubePlays[roomName]) {
                                storedYoutubePlays[roomName].time++;
                            } else {
                                clearInterval(ytInterval)
                            }
                        }, 1000)
                    } else { //pause
                        clearInterval(ytInterval)
                    }
                    storedYoutubePlays[roomName].status = content.data;
                } else if (content.key == "loadVideo") {
                    storedYoutubePlays[roomName] = {
                        url: content.data,
                        status: 1,
                        time: 0
                    }
                }
            }
        });

        socket.on('secondHandUp', function (content) {
            content = escapeAllContentStrings(content);
            if (!isModerator()) {
                content["senderId"] = socket.id;
            }
            sendToHoleRoom(roomName, 'secondHandUp', content);
        });

        socket.on('changeTab', function (content) {
            content = escapeAllContentStrings(content);
            if (isModerator()) {
                currentLoadedTab[roomName] = content;
                var items = userPItems[roomName] ? userPItems[roomName][currentLoadedTab[roomName]] : null;
                sendToHoleRoom(roomName, "changeTab", { "tab": content, "userPItems": items });
                if (content != "#homeScreen") {
                    snake.stopGame(roomName);
                }
                delete storedYoutubePlays[roomName];
            }
        });

        socket.on('setUserPItemsText', function (content) {
            content = escapeAllContentStrings(content);
            content["userId"] = socket.id;
            if (content.image) {
                sendToHoleRoom(roomName, "setUserPItemsText", content);
            } else {
                sendToHoleRoomButNotMe(roomName, socket.id, "setUserPItemsText", content);
            }

            for (var i = 0; i < userPItems[roomName][currentLoadedTab[roomName]].length; i++) {
                if (userPItems[roomName][currentLoadedTab[roomName]][i]["itemId"] == content["itemId"]) {
                    userPItems[roomName][currentLoadedTab[roomName]][i]["text"] = content["text"];
                    sendToHoleRoom(roomName, 'updateUserPItem', userPItems[roomName][currentLoadedTab[roomName]][i]);
                }
            }
        });

        socket.on('setUserColor', function (color) {
            content = escapeAllContentStrings(content);
            userdata["color"] = color;
            sendToHoleRoom(roomName, 'setUserColor', { "userId": socket.id, "color": color });
        });

        socket.on('shareNotes', function (content) {
            content = escapeAllContentStrings(content);
            var text = content["text"];
            var noteType = content["noteType"];
            if (typeof (allSingleFiles[roomName]) == "undefined") {
                allSingleFiles[roomName] = {};
            }

            var userInfo = allUserAttr[socket.id];
            var filename = noteType + "" + (+new Date()) + ".txt";
            fs.writeFile('./public/singlefiles/' + filename, text, function (err) {
                if (err) {
                    return console.log("NoteSharFileSaveError", err);
                }

                allSingleFiles[roomName][filename] = { "filename": filename, "username": userInfo.username, "date": +new Date() };
                sendToHoleRoom(roomName, 'sigleFilesTable', allSingleFiles[roomName]);
                saveSingleFileTable();
                console.log("NoteFileSaved!");
            });
        });

        socket.on('changeElementSize', function (content) {
            content = escapeAllContentStrings(content);
            content["userId"] = socket.id;
            sendToHoleRoomButNotMe(roomName, socket.id, "changeElementSize", content);
            for (var i = 0; i < userPItems[roomName][currentLoadedTab[roomName]].length; i++) {
                if (userPItems[roomName][currentLoadedTab[roomName]][i]["itemId"] == content["itemId"]) {
                    userPItems[roomName][currentLoadedTab[roomName]][i]["width"] = content["width"];
                    userPItems[roomName][currentLoadedTab[roomName]][i]["height"] = content["height"];
                    sendToHoleRoom(roomName, 'updateUserPItem', userPItems[roomName][currentLoadedTab[roomName]][i]);
                }
            }
        });

        socket.on('3dPos', function (pos) {
            pos = escapeAllContentStrings(pos);
            if (isModerator()) {
                sendToHoleRoomButNotMe(roomName, socket.id, "3dPos", pos);
            }
        });

        socket.on('drawSomething', function (content) {
            content = escapeAllContentStrings(content);
            sendToHoleRoomButNotMe(roomName, socket.id, "drawSomething", content);
        });

        socket.on('sendEndDraw', function (content) {
            content = escapeAllContentStrings(content);
            var itemId = content["itemId"];
            var drawBuffer = content["drawBuffer"];
            for (var i = 0; i < userPItems[roomName][currentLoadedTab[roomName]].length; i++) {
                if (userPItems[roomName][currentLoadedTab[roomName]][i]["itemId"] == itemId) {
                    if (!userPItems[roomName][currentLoadedTab[roomName]][i]["drawBuffer"]) {
                        userPItems[roomName][currentLoadedTab[roomName]][i]["drawBuffer"] = [];
                    }
                    userPItems[roomName][currentLoadedTab[roomName]][i]["drawBuffer"] = userPItems[roomName][currentLoadedTab[roomName]][i]["drawBuffer"].concat(drawBuffer);
                    sendToHoleRoom(roomName, 'updateUserPItem', userPItems[roomName][currentLoadedTab[roomName]][i]);
                }
            }
        });

        socket.on('drawWhiteboard', function (content) {
            content = escapeAllContentStrings(content);
            s_whiteboard.handleEventsAndData(content);
            delete content["wid"];
            sendToHoleRoomButNotMe(roomName, socket.id, "drawWhiteboard", content);
        });

        socket.on('lockUnLockCanvas', function (content) {
            content = escapeAllContentStrings(content);
            var itemId = content.itemId;
            var lockUnlock = content.lockUnlock;
            sendToHoleRoomButNotMe(roomName, socket.id, "lockUnLockCanvas", content);
            for (var i = 0; i < userPItems[roomName][currentLoadedTab[roomName]].length; i++) {
                if (userPItems[roomName][currentLoadedTab[roomName]][i]["itemId"] == itemId) {
                    userPItems[roomName][currentLoadedTab[roomName]][i]["lockUnlock"] = lockUnlock;
                    sendToHoleRoom(roomName, 'updateUserPItem', userPItems[roomName][currentLoadedTab[roomName]][i]);
                    return;
                }
            }
        });

        socket.on('makeTransparent', function (content) {
            content = escapeAllContentStrings(content);
            var itemId = content.itemId;
            var transparent = content.transparent;
            sendToHoleRoom(roomName, "makeTransparent", content);
            for (var i = 0; i < userPItems[roomName][currentLoadedTab[roomName]].length; i++) {
                if (userPItems[roomName][currentLoadedTab[roomName]][i]["itemId"] == itemId) {
                    userPItems[roomName][currentLoadedTab[roomName]][i]["transparent"] = transparent;
                    sendToHoleRoom(roomName, 'updateUserPItem', userPItems[roomName][currentLoadedTab[roomName]][i]);
                    return;
                }
            }
        });

        socket.on('removeSingleFileEX', function (fileName) {
            fileName = escapeAllContentStrings(fileName);
            fs.unlink("./public/singlefiles/" + fileName, function (err) {
                if (err) {
                    console.error(err)
                    return;
                }
            });
            if (allSingleFiles[roomName])
                delete allSingleFiles[roomName][fileName];
            sendToHoleRoom(roomName, 'sigleFilesTable', allSingleFiles[roomName]);
            saveSingleFileTable();
        });

        socket.on('getSingleFileTable', function () {
            sendToHoleRoom(roomName, 'sigleFilesTable', allSingleFiles[roomName]);
        });

        socket.on('startStopSnake', function (trueFalse) {
            trueFalse = escapeAllContentStrings(trueFalse);
            snake.startStopSnake(socket.id, roomName, trueFalse);
        });

        socket.on('snakeKeyPressed', function (key) {
            key = escapeAllContentStrings(key);
            snake.snakeKeyPressed(socket.id, roomName, key);
        });

        socket.on('sendZoom', function (content) {
            content = escapeAllContentStrings(content);
            if (isModerator()) {
                sendToHoleRoom(roomName, 'sendZoom', content);
            }
        });


        socket.on('getUserInfos', function (id) {
            id = escapeAllContentStrings(id);
            var infos = allUserAttr[id];
            if (infos)
                socket.emit('getUserInfos', infos);

            if (id == allRoomAttr[roomName].moderator) {
                socket.emit('setModerator', id);
            }
        });

        socket.on('putRemoteHandDown', function (id) {
            id = escapeAllContentStrings(id);
            if (isModerator()) {
                sendToHoleRoom(roomName, 'putRemoteHandDown', id);
            }
        });

        socket.on('delete3DObj', function (name) {
            name = escapeAllContentStrings(name);
            if (isModerator()) {
                if (all3DObjs[roomName]) {
                    for (var i = 0; i < all3DObjs[roomName].length; i++) {
                        if (all3DObjs[roomName][i]["name"] == name) {
                            all3DObjs[roomName].splice(i, 1);
                        }
                    }
                    fs.remove('public/3dObjs/' + name, function (err) {
                        if (err)
                            console.log("DELERROR:", err);
                    });
                    save3DObjs();
                }
                sendToHoleRoom(roomName, 'load3DObjs', all3DObjs[roomName]);
            }
        });

        socket.on('show3DObj', function (url) {
            url = escapeAllContentStrings(url);
            if (isModerator()) {
                url3dObjs[roomName] = url;
                sendToHoleRoom(roomName, 'show3DObj', url);
            }
        });

        socket.on('getTimeStamp', function () {
            socket.emit('getTimeStamp', +new Date());
        });

        socket.emit('getTimeStamp', +new Date());
        setInterval(function () {
            socket.emit('getTimeStamp', +new Date());
        }, 60000);

        socket.on('audioVolume', function (vol) {
            vol = escapeAllContentStrings(vol);
            sendToHoleRoom(roomName, 'audioVolume', { "userId": socket.id, "vol": vol });
        });

        callback()
    });

    function isModerator() {
        if (allRoomAttr[roomName]["moderator"] == socket.id)
            return true;
        return false;
    }

});

function removePraesi(name, roomName) {
    name = escapeAllContentStrings(name);
    roomName = escapeAllContentStrings(roomName);
    delete allPraesis[roomName][name];
    fs.remove('public/praesis/' + roomName.split("###")[0] + '/' + name, function (err) {
        if (err)
            console.log("DELERROR:", err);
    });
}

function progressUploadFormData(formData) {
    formData = escapeAllContentStrings(formData);
    var fields = formData.fields;
    var files = formData.files;
    var uploadType = fields["uploadType"];
    var roomName = fields["room"];
    var userId = fields["userId"];
    var userInfo = allUserAttr[userId];
    if (!userInfo) {
        console.log("Error: Cant get User infos!");
        return;
    }

    if (uploadType == "praesi") {
        var praesiName = trim(fields["praesiName"]);
        var praesiType = trim(fields["praesiType"]);
        var path = "./public/praesis/" + roomName.split("###")[0] + "/" + praesiName;
        if (typeof (allPraesis[roomName]) == "undefined")
            allPraesis[roomName] = {};

        if (typeof (praesiName) == "undefined" || praesiName == "") {
            console.log("empty praesiName not allowed!");
            return;
        }

        fs.ensureDir(path).then(() => {
            if (praesiType == "revealPraesi") {
                var indexFile = trim(fields["indexFile"]);
                var fileCtn = 0;
                var file = null;
                for (var i in files) {
                    fileCtn++;
                    file = files[i];
                }
                if (fileCtn != 1) {
                    console.error("More than one File uploaded", files.length);
                    return;
                }

                //Save Zip File
                // try {
                //     fs.createReadStream(file.path).pipe(fs.createWriteStream(path+'/'+file.name));
                // } catch (e) {
                //     console.log("fileUploadServerError",e);
                //     return;
                // }

                yauzl.open(file.path, function (err, zipfile) {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    zipfile.on("entry", function (entry) {
                        if (/\/$/.test(entry.fileName)) {
                            // Dont do something on dirs
                            return;
                        }
                        zipfile.openReadStream(entry, function (err, readStream) {
                            if (err) {
                                console.error(err);
                                return;
                            }
                            var filesplit = entry.fileName.split("/");
                            var dir = path;
                            for (var i = 0; i < filesplit.length - 1; i++) {
                                dir += "/" + filesplit[i];
                            }
                            fs.ensureDir(dir, function (err) {
                                if (err) {
                                    console.error(err);
                                    removePraesi(praesiName, roomName);
                                    return;
                                }
                                readStream.pipe(fs.createWriteStream(dir + "/" + filesplit[filesplit.length - 1]));
                            });

                        });
                    });
                    var secondCheck = false;
                    zipfile.on("end", function () {
                        function finishInit(tryCnt) {
                            if (praesiType == "revealPraesi" && fs.existsSync(path + "/js/reveal.js")) {

                                fs.readFile(path + '/' + indexFile, function read(err, data) {
                                    if (err) {
                                        console.log("Indexfile not found!");
                                        if (tryCnt < 8) {
                                            console.log("But try again!", tryCnt);
                                            setTimeout(function () { finishInit(++tryCnt); }, 300);//Wait for data to be written
                                        } else {
                                            delete allPraesis[roomName][praesiName];
                                        }
                                        return;
                                    }
                                    var dataString = data.toString();
                                    var slideCtn = undefined;
                                    if (praesiType == "revealPraesi") {
                                        slideCtn = dataString.split('<section').length;
                                    }

                                    allPraesis[roomName][praesiName] = {
                                        "name": praesiName,
                                        "type": praesiType,
                                        "indexFile": indexFile,
                                        "slideCtn": slideCtn
                                    };
                                    saveAllPraesis();
                                    sendToHoleRoom(roomName, 'loadPraesis', allPraesis[roomName]);
                                });
                            } else if (tryCnt <= 4 && !secondCheck) {
                                //Check if files are in subfolder
                                fs.readdir(path, function (err, files) {
                                    if (err) {
                                        console.log("praesi readdir error:", err)
                                        return;
                                    }
                                    if (files.length == 1) {
                                        fs.readdir(path + "/" + files[0], function (err, files2) {
                                            if (err) {
                                                console.log("praesi readdir error2:", err)
                                                return;
                                            }
                                            for (var i = 0; i < files2.length; i++) {
                                                (function () {
                                                    var k = i;
                                                    fs.move(path + "/" + files[0] + "/" + files2[i], path + "/" + files2[i], function (err) {
                                                        if (err) return console.error("praesi readdir error2:", err);
                                                        if (k == files2.length - 1) {
                                                            console.log("DONE! MOVING PRAESI FILES! FOR:", path);
                                                            secondCheck = true;
                                                            finishInit(0);
                                                        }
                                                    })
                                                })();
                                            }
                                        });
                                    } else {
                                        delete allPraesis[roomName][praesiName];
                                        console.log("Error: More than one subfolder at praesi upload!");
                                    }
                                });
                            } else if (tryCnt >= 4) {
                                delete allPraesis[roomName][praesiName];
                                console.log("Dont ex", path, praesiType);
                            } else {
                                console.log("try to verify zip:", tryCnt, secondCheck);
                                setTimeout(function () { finishInit(++tryCnt) }, 200);//Wait for data to be written
                            }
                        }
                        finishInit(0)
                    });
                });
            } else if (praesiType == "pdfPraesi") {
                //START PDF PRAESI
                var fileCtn = 0;
                var file = null;
                for (var i in files) {
                    fileCtn++;
                    file = files[i];
                }
                if (fileCtn != 1) {
                    console.error("More than one File uploaded", files.length);
                    return;
                }

                var filespilt = file.name.split(".");
                if (filespilt[filespilt.length - 1].toLowerCase() != "pdf") {
                    console.error("upload was not a pdf", files.length);
                    return;
                }

                fs.createReadStream(file.path).pipe(fs.createWriteStream(path + '/' + file.name));

                allPraesis[roomName][praesiName] = {
                    "name": praesiName,
                    "type": praesiType,
                    "filename": file.name
                };
                saveAllPraesis();

                sendToHoleRoom(roomName, 'loadPraesis', allPraesis[roomName]);
                //End PDF PRAESI

            } else if (praesiType == "elsePraesi") {
                //START ELSE PRAESI
                var fileCtn = 0;
                var file = null;
                for (var i in files) {
                    fileCtn++;
                    file = files[i];
                }
                if (fileCtn != 1) {
                    console.error("More than one File uploaded", files.length);
                    return;
                }
                var fileName = file.name.replace(/[^a-zA-Z0-9.+]/g, "_");
                fs.createReadStream(file.path).pipe(fs.createWriteStream(path + '/' + fileName));

                var cmd = 'unoconv -f pdf -o ' + fileName + '.pdf ' + fileName;
                sendToUserById(userId, 'praesiConvertion', { type: "info", msg: "beginConversion" });
                exec(cmd, { cwd: path }, function (error, stdout, stderr) {
                    if (error) {
                        sendToUserById(userId, 'praesiConvertion', { type: "error", msg: JSON.stringify(error) });
                        return console.log(error);
                    }

                    allPraesis[roomName][praesiName] = {
                        "name": praesiName,
                        "type": "pdfPraesi",
                        "filename": fileName + '.pdf'
                    };
                    saveAllPraesis();
                    sendToUserById(userId, 'praesiConvertion', { type: "info", msg: "successConversion" });
                    sendToHoleRoom(roomName, 'loadPraesis', allPraesis[roomName]);
                });
                //End ELSE PRAESI
            } else {
                console.log("unknown praesiType!");
            }
        }).catch(err => {
            console.log("could not create praesiFolder", praesiName);
        });
    } else if (uploadType == "singleFileUpload") {
        if (typeof (allSingleFiles[roomName]) == "undefined") {
            allSingleFiles[roomName] = {};
        }

        for (var i in files) {
            var file = files[i];
            if (file.name != "") {
                try {
                    fs.createReadStream(file.path).pipe(fs.createWriteStream('public/singlefiles/' + file.name));
                    allSingleFiles[roomName][file.name] = { "filename": file.name, "username": userInfo.username, "date": +new Date() };
                    console.log(file.name, "uploaded");
                } catch (e) {
                    console.log("singleFileUploadError122", e);
                }
            }
        }

        var imagedata = fields["imagedata"];
        var name = fields["name"] || "";
        var date = fields["date"] || (+new Date());
        if (imagedata && imagedata != "") { //Its a video frame save
            imagedata = imagedata.replace(/^data:image\/png;base64,/, "");
            imagedata = imagedata.replace(/^data:image\/jpeg;base64,/, "");
            imagedata = imagedata.replace(/^data:image\/jpg;base64,/, "");
            imagedata = imagedata.replace(/^data:image\/gif;base64,/, "");
            var filename = userInfo.username + "_" + name + "_" + date + ".png";
            allSingleFiles[roomName][filename] = { "filename": filename, "username": userInfo.username, "date": +new Date() };
            fs.writeFile('public/singlefiles/' + filename, imagedata, 'base64', function (err) {
                if (err) {
                    delete allSingleFiles[roomName][filename];
                }
            });
        }

        var imagedataJson = fields["imagedataJson"];
        if (imagedataJson && imagedataJson != "") { //Its a video frame save
            var filename = userInfo.username + "_" + name + "_" + (+new Date()) + ".json"
            allSingleFiles[roomName][filename] = { "filename": filename, "username": userInfo.username, "date": +new Date() };
            fs.writeFile('public/singlefiles/' + filename, imagedataJson, 'utf8', function (err) {
                if (err) {
                    delete allSingleFiles[roomName][filename];
                }
            });
        }

        sendToHoleRoom(roomName, 'sigleFilesTable', allSingleFiles[roomName]);
        saveSingleFileTable();
    } else if (uploadType == "profilePic") {
        for (var i in files) {
            var file = files[i];
            try {
                fs.createReadStream(file.path).pipe(fs.createWriteStream('public/profilePics/' + userInfo.username));
                console.log("File Saved:" + file.name);
            } catch (e) {
                console.log("profilePicFileUploadServerError", e);
            }
        }

        sendToHoleRoom(roomName, 'profilePicChange', { "userId": userId, "username": userInfo.username });
    } else if (uploadType == "3dObj") {
        let name = trim(fields["name"]);
        var path = "./public/3dObjs/" + name;
        var fileCtn = 0;
        var file = null;
        for (var i in files) {
            fileCtn++;
            file = files[i];
        }
        if (fileCtn != 1) {
            console.error("More than one File uploaded", files.length);
            return;
        }

        yauzl.open(file.path, function (err, zipfile) {
            if (err) {
                console.error(err);
                return;
            }
            var fileArray = [];
            zipfile.on("entry", function (entry) {
                if (/\/$/.test(entry.fileName)) {
                    // Dont do something on dirs
                    return;
                }
                fileArray.push(entry.fileName);
                zipfile.openReadStream(entry, function (err, readStream) {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    var filesplit = entry.fileName.split("/");
                    var dir = path;
                    for (var i = 0; i < filesplit.length - 1; i++) {
                        dir += "/" + filesplit[i];
                    }
                    fs.ensureDir(dir, function (err) {
                        if (err) {
                            console.error(err);
                            return;
                        }
                        var nameSplit = filesplit[filesplit.length - 1].split(".");
                        readStream.pipe(fs.createWriteStream(dir + "/" + filesplit[filesplit.length - 1]));
                    });
                });
            });
            zipfile.on("end", function () {
                if (!all3DObjs[roomName]) {
                    all3DObjs[roomName] = [];
                }
                all3DObjs[roomName].push({ "name": name, "fileArray": fileArray });
                save3DObjs();
                sendToUserById(userId, '3dObjUploadMsg', { type: "info", msg: "Zip extracted!" });
                sendToHoleRoom(roomName, 'load3DObjs', all3DObjs[roomName]);
            });
        });
    } else {
        console.log("unknown uploadType!");
    }
}

snake.addGameCallbacks(function (theRoomName, players) {
    sendToHoleRoom(theRoomName, 'updateSnakeGame', players);
}, function (theRoomName) { //EndSnake game
    sendToHoleRoom(theRoomName, 'endSnakeGame', false);
}, function (theRoomName, socketId) { //EndSnake game
    sendToHoleRoom(theRoomName, 'removeSnakePlayer', socketId);
}, function (theRoomName, eatable) { // updateEatableCallback
    sendToHoleRoom(theRoomName, 'updateEatable', eatable);
}, function (theRoomName, players) { //showSnakeStatsCallback
    sendToHoleRoom(theRoomName, 'showSnakeStats', players);
});

function sendToHoleRoom(roomName, key, content) {
    content = escapeAllContentStrings(content);
    key = escapeAllContentStrings(key);
    roomName = escapeAllContentStrings(roomName);
    io.in(roomName).emit(key, content)
}

function sendToHoleRoomButNotMe(roomName, mySocketId, key, content) {
    content = escapeAllContentStrings(content);
    key = escapeAllContentStrings(key);
    roomName = escapeAllContentStrings(roomName);
    mySocketId = escapeAllContentStrings(mySocketId);
    allSockets[mySocketId].to(roomName).emit(key, content);
}

function sendToUserById(userId, key, content) {
    key = escapeAllContentStrings(key);
    content = escapeAllContentStrings(content);
    userId = escapeAllContentStrings(userId);
    allSockets[userId].emit(key, content);
}

function saveSingleFileTable() {
    try {
        var allSingleFilesString = JSON.stringify(allSingleFiles);
        fs.writeFileSync("./db/singleFileTable.txt", allSingleFilesString);
    } catch (e) {
        console.log("Faild to save FileTable!", e);
    }
}

function loadALlSingleFiles() {
    fs.readFile('./db/singleFileTable.txt', 'utf8', function (err, data) {
        if (err) {
            return console.log("warning: File ./db/singleFileTable.txt not found (yet).");
        }
        try {
            allSingleFiles = JSON.parse(data);
        } catch (e) {
            console.log("error reading ./db/singleFileTable.txt", e);
        }
    });
}
loadALlSingleFiles();

function saveAllPraesis() {
    try {
        var allPraesisString = JSON.stringify(allPraesis);
        if (typeof (allPraesisString) == "string") {
            fs.writeFileSync("./db/praesiSave.txt", allPraesisString);
        }
    } catch (e) {
        console.log("Faild to save allPraesis!", e);
    }
}

function loadALlPreasis() {
    fs.readFile('./db/praesiSave.txt', 'utf8', function (err, data) {
        if (err) {
            return console.log("warning: File ./db/praesiSave.txt not found (yet).");
        }
        try {
            allPraesis = JSON.parse(data);
        } catch (e) {
            console.log("error reading ./db/praesiSave.txt", e);
        }
    });
}
loadALlPreasis();

function getAllRoomsWithoutPasswords() {
    var cleanRoomAttr = JSON.parse(JSON.stringify(allRoomAttr));
    for (var i in cleanRoomAttr) {
        if (cleanRoomAttr[i]["roomPassword"] != "") {
            cleanRoomAttr[i]["hasPassword"] = true;
        }
        delete cleanRoomAttr[i]["roomPassword"];
    }
    return cleanRoomAttr;
}

function deleteRoom(roomname) {
    delete allRoomAttr[roomname];
}

function saveAllRoomAttr() {
    try {
        var currDate = +new Date();
        var daysInMillis = config["accConfig"]["deleteUnusedRoomsAfterDays"] * 1000 * 60 * 60 * 24;
        for (var i in allRoomAttr) {
            if (!allRoomAttr[i]["permanent"] && config["accConfig"]["deleteUnusedRoomsAfterDays"] != 0 && currDate - allRoomAttr[i]["lastVisit"] > daysInMillis) {
                deleteRoom(i)
            } else {
                allRoomAttr[i]["users"] = {};
                allRoomAttr[i]["moderator"] = null;
            }
        }

        var allRoomAttrString = JSON.stringify(allRoomAttr);
        fs.writeFileSync("./db/allRoomAttr.txt", allRoomAttrString);
    } catch (e) {
        console.log("Faild to save allRoomAttr!", e);
    }
}

function loadAllRoomAttr() {
    fs.readFile('./db/allRoomAttr.txt', 'utf8', function (err, data) {
        if (err) {
            return console.log("warning: File ./db/allRoomAttr.txt not found (yet).");
        }
        try {
            allRoomAttr = JSON.parse(data);
            for (var i in allRoomAttr) {
                allRoomAttr[i]["users"] = {};
                allRoomAttr[i]["moderator"] = null;
            }
        } catch (e) {
            console.log("error reading ./db/allRoomAttr.txt", e);
        }
    });
}

loadAllRoomAttr();

function loadALlUserPItems() {
    fs.readFile('./db/userPItems.txt', 'utf8', function (err, data) {
        if (err) {
            return console.log("warning: File ./db/userPItems.txt not found (yet).");
        }
        try {
            userPItems = JSON.parse(data);
        } catch (e) {
            console.log("error reading ./db/userPItems.txt", e);
        }
    });
};

loadALlUserPItems();

function saveUserPItems() {
    try {
        var userPItemsString = JSON.stringify(userPItems);
        fs.writeFileSync("./db/userPItems.txt", userPItemsString);
    } catch (e) {
        console.log("Faild to save userPItems!", e);
    }
}

function loadAll3DObjs() {
    fs.readFile('./db/all3DObjs.txt', 'utf8', function (err, data) {
        if (err) {
            return console.log("warning: File ./db/all3DObjs.txt not found (yet).");
        }
        try {
            all3DObjs = JSON.parse(data);
        } catch (e) {
            console.log("error reading ./db/all3DObjs.txt", e);
        }
    });
};

loadAll3DObjs();

function save3DObjs() {
    try {
        var the3DString = JSON.stringify(all3DObjs);
        fs.writeFileSync("./db/all3DObjs.txt", the3DString);
    } catch (e) {
        console.log("Faild to save 3DObjs!", e);
    }
}

//Put this in to trace console line numbers
// var log = console.log;
// console.log = function() {
//     log.apply(console, arguments);
//     // Print the stack trace
//     console.trace();
// };

// CLEANUP ON EXIT
process.on('exit', function (code) {
    console.log('Cleanup and exit!');
    saveUserPItems();
    process.exit();
});

//catches ctrl+c event
process.on('SIGINT', function (code) {
    process.exit();
});

//catches uncaught exceptions
process.on('uncaughtException', function (code) {
    console.log("We encouter an error... wait for config to be write then exit!")
    setTimeout(function () {
        console.log("exit", code);
        process.exit();
    }, 1000)
});

//Prevent cross site scripting (xss)
function escapeAllContentStrings(content, cnt) {
    if (!cnt) cnt = 0;

    if (typeof content === "string") {
        return DOMPurify.sanitize(content);
    }
    for (var i in content) {
        if (typeof content[i] === "string") {
            content[i] = DOMPurify.sanitize(content[i]);
        }
        if (typeof content[i] === "object" && cnt < 10) {
            content[i] = escapeAllContentStrings(content[i], ++cnt);
        }
    }
    return content;
}