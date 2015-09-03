var requireFu = require('require-fu');

function HttpAPI(settings) {

	var Yamaha = require('./yamaha.js');

	// ideally get this from the 'settings' object!
	var ip = "192.168.1.31"

	console.log("Connecting to: " + ip);

	var yamaha = new Yamaha(ip);

	this.requestHandler = function (req, res) {

		var url = req.url.toLowerCase();

		if (url.indexOf("state") > -1) {

			GetState();
			GetSystemConfig(res);

		} else if (url.indexOf("power") > -1) {

			if (url.indexOf("on") > -1) {
				console.log("Powering On Receiver");
				setPowerState(true, res);
			} else if (url.indexOf("off") > -1) {
				console.log("Powering Off Receiver");
				setPowerState(false, res);
			} else {
				console.log("Unknown route: " + url);
				finishResponseWithJSONResult(null, res);
			}

		} else if (url.indexOf("volume") > -1) {
			
			if (url.indexOf("up") > -1) {
				console.log("Increasing Receiver Volume");
				increaseVolume(res);
			} else if (url.indexOf("down") > -1) {
				console.log("Decreasing Receiver Volume");
				decreaseVolume(res);
			} else {
				console.log("Getting Current Volume");
				yamaha.getVolume(res).then(function(result){
					finishResponseWithJSONResult(result, res);
				});
			}

		} else if (url.indexOf("mute") > -1) {

			if (url.indexOf("on") > -1) {
				console.log("Increasing Receiver Volume");
				mute(true, res);
			} else if (url.indexOf("off") > -1) {
				console.log("Decreasing Receiver Volume");
				mute(false, res);
			} else {
				console.log("Unknown route: " + url);
				finishResponseWithJSONResult(null, res);
			}

		} else if (url.indexOf("input") > -1) {

			var inputName = url.split('input/')[1].toUpperCase();
			selectInput(inputName, res);

		} else if (url.indexOf("spotify") > -1) {

			handleSpotifyRequest(url, res);

		} else {

			console.log("Unknown route: " + url);
			finishResponseWithJSONResult(null, res);

		}
	};

	function GetState(){
		yamaha.isOn().then(function(result){
			console.log("Power on: ", result);
		});

		yamaha.getVolume().then(function(result){
			console.log("Volume: ", result);
		});

		yamaha.getStatus().then(function(result){
			console.log("Status: %j", result);
		});
	}

	function GetSystemConfig(res){
		yamaha.getSystemConfig().then(function(result){
			finishResponseWithJSONResult(result, res);
		});
	};

	function setPowerState(state, res){
		if (state) {
			yamaha.setPower("on").then(function(result) {
				finishResponseWithJSONResult(result, res);
			});
		} else {
			yamaha.setPower("off").then(function(result) {
				finishResponseWithJSONResult(result, res);
			});
		}
	};

	function increaseVolume(res){
		yamaha.getVolume().then(function(result){
			var newVolume = parseInt(result)+50;
			console.log("Increasing volume to " + newVolume);
			setVolume(newVolume, res);
		});
	};

	function decreaseVolume(res){
		yamaha.getVolume().then(function(result){
			var newVolume = parseInt(result)-50;
			console.log("Decreasing volume to " + newVolume);
			setVolume(newVolume, res);
		});
	};

	function setVolume(value, res){
		yamaha.setVolume(value).then(function(result) {
			console.log("Volume set to: ", result);
			finishResponseWithJSONResult({"volume" :result}, res);
		});
	};

	function mute(value, res){
		yamaha.setMute(value ? "on" : "off").then(function(result){
			finishResponseWithJSONResult(result, res);
		});
	};

	function selectInput(value, res){
		yamaha.setInput(value).then(function(result){
			finishResponseWithJSONResult(result, res);
		});
	};

	function handleSpotifyRequest(url, res){

		// TODO use options for the input here
		selectInput("HDMI4", null);
		setVolume(-300, null);

		var trackDesc = function (track) {
			return track.name + " by " + track.artists[0].name + " from " + track.album.name;
		};

		var queueAndPlay = function (playlistNum, trackNum) {
			
			playlistNum = playlistNum || 0;
			trackNum = trackNum || 0;
			
			console.log("Playlist Number: " + playlistNum + "   Track Number: " + trackNum);

			mopidy.playlists.getPlaylists().then(function (playlists) {
				var playlist = playlists[playlistNum];
				console.log("Loading playlist:", playlist.name);
				return mopidy.tracklist.add(playlist.tracks).then(function (tlTracks) {
					return mopidy.playback.play(tlTracks[trackNum]).then(function () {
						return mopidy.playback.getCurrentTrack().then(function (track) {
							console.log("Now playing:", trackDesc(track));
						});
					});
				});
				finishResponseWithJSONResult(null, res);
			})
            .catch(console.error.bind(console)) // Handle errors here
            .done();                            // ...or they'll be thrown here
            finishResponseWithJSONResult(null, res);
        };

        var mopidy = new Mopidy({
        	webSocketUrl: "ws://192.168.1.230:6680/mopidy/ws/"
        });
        mopidy.on(console.log.bind(console));  // Log all events
        mopidy.on("state:online", queueAndPlay);

    };

    function finishResponseWithJSONResult(value, res) {
    	if (res) {
    		if (value) {
    			var jsonResponse = JSON.stringify(value);
    			res.setHeader('Content-Length', Buffer.byteLength(jsonResponse));
    			res.setHeader('Content-Type', 'application/json;charset=utf8');
    			res.write(new Buffer(jsonResponse));
    		}
    		res.end();
    	} else {
    		console.warn("No response object to close...");
    	}
    };
}

module.exports = HttpAPI;
