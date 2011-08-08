require('./map');
require('./user');
var util = require('util');
require('./stats');
require('./update');

BGTEngine = function(){
	var me = this;
	this.users = [];
	this.connections = [];
	this.userTimeouts = {};
	this.map = BGTMap.getMap(2);
	this.stats = new BGTStatsEngine(this);
	this.stats.on('stats', function(stats) {
		me.sendUpdates({
                	stats:[new BGTUpdate(me.stats.getStatsXML(stats))]
        	});
	});
	this.onUserUpdate = function(user, location){
		me.sendLocationUpdates(user);
		me.keepAliveUser(user);
	}
}

BGTEngine.prototype.setMap = function(map) {
	if (map == this.map) return;
	util.log('setting new map: ' + map.name);
	this.map = map;
	var me = this;
	map.getMapXML(function(err, xml){
		me.sendUpdates({
			map:[new BGTUpdate(xml)]
		});
	});
	for (var i in this.users) {
		var user = this.users[i];
		if (user.hasPosition() && user.position.map != this.map) user.resetPosition();
	}
}

BGTEngine.prototype.addUser = function(user) {
	if (this.users[user.uid] == user) return;
	var me = this;
	this.users[user.uid] = user;
	user.on('locationupdate', this.onUserUpdate);
}

BGTEngine.prototype.removeUser = function(user){
	if (!this.users[user.uid]) return;
	this.users[user.uid].removeListener('updatelocation', this.onUserUpdate);
	delete this.users[user.uid];
	if (this.userTimeouts[user.uid]) clearTimeout(this.userTimeouts[user.uid]);
	this.sendUpdates({
		quit:[new BGTUpdate('<user id="' + user.uid + '"/>')]
	});
}

BGTEngine.prototype.getMap = function() {
	return this.map;
}

BGTEngine.prototype.loadModule = function(request) {
	var module
	try {
		module = require('./modules/' + request.module);
	} catch (e) {
		module = require('./modules/error');
	}
	return module;
}

BGTEngine.prototype.updateUserLocation = function(user, location) {
	this.addUser(user);
	user.updateLocation(location);
}

BGTEngine.prototype.keepAliveUser = function(user) {
	var me = this;
	if (this.userTimeouts[user]) clearTimeout(this.userTimeouts[user]);
	this.userTimeouts[user] = setTimeout(function(){
		util.log(user + ': update timeout');
		me.removeUser(user);
	}, 60000);
}

BGTEngine.prototype.addMapConnection = function(conn) {
	var me = this;
	this.connections.push(conn);
	conn.request.req.on('close', function() {
		conn.close();
		me.removeMapConnection(conn);
	});
	this.sendCurrentLocations(conn);
}

BGTEngine.prototype.removeMapConnection = function(conn) {
	for (var i = 0; i < this.connections.length; i++) {
		if (this.connections[i] == conn) this.connections.splice(i, 1);
	}
}

BGTEngine.prototype.sendCurrentLocations = function(conn) {
	var me = this;
	this.getMap().getMapXML(function(err, xml){
		conn.sendUpdates({
			movements:me.getLocationXML(me.users),
			map:[new BGTUpdate(xml)],
			stats:[new BGTUpdate(me.stats.getStatsXML())]
		});
	});
}

BGTEngine.prototype.sendLocationUpdates = function(user) {
	this.sendUpdates({
		movements:this.getLocationXML([user])
	});
}

BGTEngine.prototype.sendUpdates = function(updates) {
	for (var i = 0; i < this.connections.length; i++) {
		this.connections[i].queueUpdate(updates);
	}
}

BGTEngine.prototype.getLocationXML = function(users) {
	outputArray = [];
	for (var i in users) {
		outputArray.push(new BGTLocationUpdate(users[i]));
	}
	return outputArray;
}
