var util = require('util'),
	http = require('http'),
	EventEmitter = require('events').EventEmitter;

BGTBridge = function(){};

util.inherits(BGTBridge, EventEmitter);

BGTBridge.Olivier = function(){};

util.inherits(BGTBridge.Olivier, BGTBridge);

BGTBridge.Olivier.prototype.sendUpdates = function(updates){
	for (var i in updates) try {
		var update = updates[i];
		if (!(update instanceof BGTLocationUpdate)) continue;
		// all users from olivier are flagged like this
		if (update.user.foreignServer) return;
		var location = update.getData().location;
		var data = {
			latitude:location.lat,
			longitude:location.lon,
			userName:update.user.getHash()
		};
		var req = http.request({
			host:'ocroquette.fr',
			path:'/bladenighttracker/userupdate',
			port:8081,
			method:'PUT'
		}, function(response){
			if (response.statusCode == 200) return;
			util.log('error from oliviers server:');
			response.pipe(process.stderr);
		});
		req.on('error', function(err){
			util.log('error sending data to olivier: ' + err.message);
		});
		req.write(JSON.stringify(data));
		req.end();
	} catch (e) { console.info(e.stack) };
};
