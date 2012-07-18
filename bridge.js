var util = require('util'),
	http = require('http'),
	EventEmitter = require('events').EventEmitter;

BGTBridge = function(){};

util.inherits(BGTBridge, EventEmitter);

BGTBridge.Olivier = function(){
	var me = this;
	me.users = {};
	me.enabled = false;
};

util.inherits(BGTBridge.Olivier, BGTBridge);

// constant password
BGTBridge.Olivier.password = 'uHHqdERal489A73FiVZxqgbUcBsq6JMKG4QlOYN1smAO59UVtv';

BGTBridge.Olivier.prototype.sendUpdates = function(updates){
	if (!this.enabled) return;
	for (var i in updates) try {
		var update = updates[i];
		if (!(update instanceof BGTLocationUpdate)) continue;
		// all users from olivier are flagged like this
		if (update.user.foreignServer) return;
		var location = update.user.location;
		var data = {
			latitude:location.lat,
			longitude:location.lon,
			userName:update.user.getName(),
			password:BGTBridge.Olivier.password
			//team:update.user.getTeam()
		};
		if (location.speed) data.speed = location.speed;
		var req = http.request({
			host:'ocroquette.fr',
			path:'/bladenighttracker/userupdate',
			port:8080,
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

BGTBridge.Olivier.prototype.getUser = function(userName) {
	var me = this;
	if (typeof me.users[userName] == 'undefined') {
		me.users[userName] = BGTUser.getOlivierUser();
	}
	return me.users[userName];
};

BGTBridge.Olivier.prototype.updateUserLocation = function(data) {
	if (!this.enabled) return;
	engine.updateUserLocation(this.getUser(data.userName), new BGTLocation({lat: data.latitude, lon: data.longitude}));
}

BGTBridge.Olivier.prototype.enable = function(){
	if (this.enabled) return;
	this.enabled = true;
}

BGTBridge.Olivier.prototype.disable = function(){
	if (!this.enabled) return;
	this.enabled = false;
}
