var util = require('util'),
	http = require('http'),
	EventEmitter = require('events').EventEmitter;

BGTBridge = function(){};

util.inherits(BGTBridge, EventEmitter);

BGTBridge.Olivier = function(){};

util.inherits(BGTBridge.Olivier, BGTBridge);

BGTBridge.Olivier.prototype.sendUpdates = function(updates){
	updates.forEach(function(update){
		if (!(update instanceof BGTLocationUpdate)) return;
		var location = update.getData().user.location;
		var data = {
			lat:location.lat,
			lon:location.lon
		};
		http.request({
			host:'ocroquette.fr',
			port:8090,
			method:'PUT'
		}, function(response){
			response.pipe(process.stdout);
		}).write(JSON.stringify(data)).on('error', function(err){
			util.log('error sending data to olivier: ' + err.message);
		}).end();
	});
};