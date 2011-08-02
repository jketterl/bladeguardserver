require('./map');
require('./user');
var util = require('util');
require('./stats');

BGTEngine = function(){
	var me = this;
	this.users = [];
	this.connections = [];
	this.userTimeouts = {};
	this.map = BGTMap.getMap(2);
	this.stats = new BGTStatsEngine(this);
	this.stats.on('stats', function(stats) {
		me.sendUpdates({
                	stats:'<bladenightlength>' + stats.bladeNightLength + '</bladenightlength>'
        	});
	});
}

BGTEngine.prototype.setMap = function(map) {
	if (map == this.map) return;
	util.log('setting new map: ' + map.name);
	this.map = map;
	var me = this;
	map.getMapXML(function(err, xml){
		me.sendUpdates({
			map:xml
		});
	});
	for (var i in this.users) {
		var user = this.users[i];
		if (user.hasPosition() && user.position.map != this.map) user.resetPosition();
	}
}

BGTEngine.prototype.addUser = function(user) {
	this.users[user.uid] = user;
}

BGTEngine.prototype.removeUser = function(user){
	delete this.users[user.uid];
	if (this.userTimeouts[user.uid]) clearTimeout(this.userTimeouts[user.uid]);
	this.sendUpdates({
		quit:'<user id="' + user.uid + '"/>'
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
	this.sendLocationUpdates(user);
	this.keepAliveUser(user);
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
		var users = me.users;
		// filter out logged in user if a session is available
		if (conn.request.session && conn.request.session.getData().user) {
			var filtered = [];
			var user = conn.request.session.getData().user;
			for (var i in users) {
				if (users[i] != user) filtered[i] = users[i];
			}
			users = filtered;
		}
		var output = me.getUpdateXML({
			movements:me.getLocationXML(users),
			map:xml,
			stats:me.stats.getStatsXML()
		});
		conn.write(output);
	});
}

BGTEngine.prototype.sendLocationUpdates = function(user) {
	this.sendUpdates({
		movements:this.getLocationXML([user])
	});
}

BGTEngine.prototype.sendUpdates = function(updates) {
	var output = this.getUpdateXML(updates)

	for (var i = 0; i < this.connections.length; i++) {
		this.connections[i].write(output);
	}
}

BGTEngine.prototype.getUpdateXML = function(updates) {
	var output = '<?xml version="1.0" encoding="UTF-8" ?>\n'+
		     '<updates>';
	for (var a in updates) {
		output += '<' + a + '>';
		output += updates[a];
		output += '</' + a + '>\n';
	}
	output += '</updates>';
	return output;
}

BGTEngine.prototype.getLocationXML = function(users) {
	output = '';
	for (var i in users) if (users[i].location) {
		user = users[i];
		output += '<user id="' + user.uid + '" name="' + user.getName() + '" team="' + user.getTeam() + '">';
		output += '<location><lat>' + user.location.lat + '</lat>';
		output += '<lon>' + user.location.lon + '</lon></location>';
		output += '</user>';
	}
	return output;
}
