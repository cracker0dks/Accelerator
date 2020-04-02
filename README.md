# Accelerator
Free Online Conference and Collaboration Tool with build in WebRTC MCU/SFU running in NodeJS

![previmg](/public/images/acc.png)

### Available functions ###

- [x] Online Conferences with up to 6 participants per room (all Audio / Video)
- [x] Online Conferences with up to 250 participants per room (all Audio / only Moderator video)
- [x] Screenshare
- [x] PDF and HTML5 Presentations
- [x] Collaborative Whiteboard ([can also be hosted standalone](https://github.com/cracker0dks/whiteboard))
- [x] Youtube viewer
- [x] 3D Object viewer
- [x] User interactions with draggable items (like Textboxes, Drawings...)
- [x] Fileshare
- [x] Text Chat
- [x] Etherpad in IFrame (Must be hosted on its own)
- [x] much more...

### Installation without Docker ###
1. install nodeJs
2. run: npm install
3. run: node server.js
4. surf to: http://127.0.0.1:8080

Note: 
* To serve it online you need a reverse proxy and deliver with https (look at "Behind a reverse Proxy" below)
* On some linux systems you need to install some extra deps to run puppeteer: [here](https://github.com/puppeteer/puppeteer/blob/master/docs/troubleshooting.md).

### Docker Installation ###
1. build . -t acc
2. run: docker run -d --net=host acc
3. surf to http://yourIp:8080

Note: 
* To serve it online you need a reverse proxy and deliver with https (look at "Behind a reverse Proxy" below)
* To have all persistent datas (config, rooms, presentations...) outside of docker, you can run it like this:

```
docker run -d --name acc --net=host -v /home/acc/config:/app/config -v /home/acc/db:/app/db  -v /home/acc/3dObjs:/app/public/3dObjs -v /home/acc/praesis:/app/public/praesis -v /home/acc/profilePics:/app/public/profilePics -v /home/acc/singlefiles:/app/public/singlefiles acc
```

### Configuration ###
On the first start a new folder "/config" will be generated. Take a look at "/config/config.json" for all parameters. Change them if you like, and restart the server. If you don't see a config.json inside the /config folder set permitions of to mount:`chmod -R 777 /home/acc` and restart the container: `docker restart acc`.

More to come...

### ToDos ###
- [ ] Better error feedback
- [ ] More, better docs
- [ ] SIP Integration
- [ ] Recording of Audio/Video (Prototype working)
- [ ] Convert WebRTC Streams to RTMP so we can stream to youtube/twitch live (Prototype working)

### GoodToKnow ###
* Audio/Video is not Peer2Peer so it will use some server CPU
* Max users per loadbalancer is about 256.
* Video is disabled in rooms with more than 6 People due to hight load (Only enabled for moderator).
* Firefox sometimes has some issues with the WebRTC audio/video, use chrome to be save
* If you are running without docker, conversion to PDF presentaions (From Powerpoint and other Docs) will not work without installing "unoconv" on your own 
* Setup a TURN Server if your clients are behind Firewalls and NATs (See configuration/setup below)
* Self made Audio MCU with AudioApi on Chromium-Stack
* Videostreams are shared SFU Style

### Loadbalancer Setup/Configuration  ###
To setup a loadbalancer just start a second Accelerator server on a different server and change this parameters in your /config/config.json
* "loadBalancerAuthKey": "key", //Change to the same loadBalancerAuthKey as the key on the master server
* "isMaster": false,
* "masterURL": "https://myAcceleratorDomain.tl", //Change this to the URL of your main server
* "enableLocalMCU": true 

Loadbalancing scheduling atm:
* All users in the same room using the same loadbalancer (Rooms are not balanced over different servers)
* First stream of room decides which loadbalancer is used for this room (loadbalancer with the least amount of streams at this moment)

### TURN Setup/Configuration ###
1. Setup your TURN Container on an extra Server: [HowTo](https://github.com/cracker0dks/turn-server-docker-image/blob/master/README.md)
2. Make a new "iceServers" entry in "/config/config.json"
```
{
	"urls": "turn:IP_TO_TURN:443",
	"turnServerCredential": "authSecret",
	"username": "webrtcuser"
}
```
- "username" can be anything you like.
- "turnServerCredential" must be the "authSecret" form the TURN Server installation.

Restart the server.

### Behind a nginx reverse Proxy ###
```
location /accelerator/ {
	resolver 127.0.0.1 valid=30s;
	proxy_set_header HOST $host;
	proxy_http_version 1.1;
	proxy_set_header Upgrade $http_upgrade;
	proxy_set_header Connection upgrade;
	proxy_pass http://127.0.0.1:8080/;
}
```

### Behind an Apache reverse Proxy ### 

```
<VirtualHost example.org:443>
...
# Proxy /accelerator/ to accelerator container
ProxyPass "/accelerator/" "http://127.0.0.1:8080/"
ProxyPassReverse "/accelerator/" "http://127.0.0.1:8080/"
...
</VirtualHost>
```
-------------------------

### Version 0 based on students project work ###
* University: [Reutlingen University](https://www.reutlingen-university.de)
* Faculty: [Informatik](https://www.inf.reutlingen-university.de/de/home/)
* Course of study: [Human-Centered Computing (Master)](https://www.inf.reutlingen-university.de/de/master/human-centered-computing/ziel-des-studiengangs/) 
* Lecture: "Kollaborative Systeme" (Collaborative Environments) 

### Authors ###

#### Students ####
* Raphael Fritsch (raphael.fritsch@reutlingen-university.de) | Backend / WebRTC (and generally further development)
* Simone Liegl (simone.liegl@gmail.com) | Frontend / Design / UX
* Sebastian Hirth | Frontend / Backend / Logo

#### Professors ####
* Gabriela Tullius (gabriela.tullius@reutlingen-university.de) | [swuxLab](https://swuxlab.reutlingen-university.de/team/)
* Peter Hertkorn (peter.hertkorn@reutlingen-university.de) | [swuxLab](https://swuxlab.reutlingen-university.de/team/)



license: GPLv3.0
