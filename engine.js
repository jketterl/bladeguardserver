require('./map');
require('./user');
var util = require('util');
require('./stats');
require('./update');
require('./bridge');
require('./tracker');

var EventEmitter = require('events').EventEmitter;

BGTEngine = function(){
	var me = this;
	this.users = [];
	this.connections = [];
	this.stats = new BGTStatsEngine(this);
	this.stats.on('stats', function(stats) {
		me.emit('stats', stats)
	});
	this.tracker = new BGTTracker(this);
};

util.inherits(BGTEngine, EventEmitter);

BGTEngine.prototype.setMap = function(map) {
	if (map == this.map) return;
	util.log('setting new map: ' + map.name);
	this.map = map;
	this.tracker.purgePositions();
	var me = this;
	if (map.loaded) {
		me.emit('map', new BGTUpdate('map', map));
	} else map.on('load', function(){
		me.emit('map', new BGTUpdate('map', map));
	});
}

BGTEngine.prototype.addUser = function(user) {
	if (this.users[user.uid] == user) return;
	var me = this;
	this.users[user.uid] = user;
}

BGTEngine.prototype.removeUser = function(user){
	if (!this.users[user.uid]) return;
	delete this.users[user.uid];
	if (user.updateTimeout) clearTimeout(user.updateTimeout);
	this.sendUpdates(new BGTUpdate('quit', {user:{id:user.uid}}));
}

BGTEngine.prototype.getMap = function() {
	return this.map;
}

BGTEngine.prototype.updateUserLocation = function(user, location, callback) {
	this.addUser(user);
	this.keepAliveUser(user);
	this.emit('movements', new BGTLocationUpdate(user));
	this.tracker.trackPosition(user, location, callback);
}

BGTEngine.prototype.keepAliveUser = function(user) {
	var me = this;
	if (user.updateTimeout) clearTimeout(user.updateTimeout);
	user.updateTimeout = setTimeout(function(){
		util.log(user + ': update timeout');
		me.removeUser(user);
	}, 60000);
}

BGTEngine.prototype.removeMapConnection = function(conn) {
	for (var i = 0; i < this.connections.length; i++) {
		if (this.connections[i] == conn) this.connections.splice(i, 1);
	}
}

BGTEngine.prototype.sendUpdates = function(updates) {
	util.log('WARN: BGTEngine.sendUpdates is deprecated');
	/*
	for (var i = 0; i < this.connections.length; i++) {
		this.connections[i].sendUpdates(updates);
	}
	*/
}

BGTEngine.prototype.getLocationXML = function(users) {
	outputArray = [];
	for (var i in users) {
		outputArray.push(new BGTLocationUpdate(users[i]));
	}
	return outputArray;
}

BGTEngine.prototype.getCurrentData = function(category) {
	var me = this;
	switch (category) {
		case 'movements':
			return me.getLocationXML(me.users);
		case 'map':
			return new BGTUpdate('map', me.getMap());
		case 'stats':
			return new BGTStatsUpdate(me.stats.getLatestStats());
		case 'quit':
			return false;
		default:
			util.log('unable to get current status data for category "' + category + '"');
	}
};

BGTEngine.prototype.enableBridges = function(){
	for (var a in this.bridges) this.bridges[a].enable();
};

BGTEngine.prototype.disableBridges = function(){
	for (var a in this.bridges) this.bridges[a].disable();
}
