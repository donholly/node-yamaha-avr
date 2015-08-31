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

	function increaseVolume(value, res){
		yamaha.getVolume().then(function(result){
			var newVolume = parseInt(result)-30;
			console.log("Increasing volume to " + newVolume);
			yamaha.setVolume(newVolume).then(function(result) {
				console.log("Volume is now set to " + result);
				finishResponseWithJSONResult({"volume" :result}, res);
			});
		});
	};

	function decreaseVolume(value, res){
		yamaha.getVolume().then(function(result){
			var newVolume = parseInt(result)+30;
			console.log("Decreasing volume to " + newVolume);
			yamaha.setVolume(newVolume).then(function(result) {
				finishResponseWithJSONResult({"volume" :result}, res);
			});
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

	function finishResponseWithJSONResult(value, res) {
		if (value) {
			var jsonResponse = JSON.stringify(value);
			res.setHeader('Content-Length', Buffer.byteLength(jsonResponse));
			res.setHeader('Content-Type', 'application/json;charset=utf8');
			res.write(new Buffer(jsonResponse));
		}
		res.end();
	};
}

module.exports = HttpAPI;
