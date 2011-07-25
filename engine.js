require('./map');
require('./user');

BGTEngine = function(){
	this.users = [];
	this.connections = [];
	this.userTimeouts = {};
	this.map = map = new BGTMap('/root/Strecke Ost lang.gpx');
}

BGTEngine.prototype.getMap = function() {
	return this.map;
}

BGTEngine.prototype.getUser = function(uid) {
	if (typeof(this.users[uid]) == 'undefined') {
		this.users[uid] = new BGTUser(uid);
	}
	return this.users[uid];
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
	var me = this;
	user.updateLocation(location);
	this.sendLocationUpdates(user);
	if (this.userTimeouts[user.uid]) clearTimeout(this.userTimeouts[user.uid]);
	this.userTimeouts[user.uid] = setTimeout(function(){
		console.log('user ' + user.uid + ': update timeout');
		me.removeUser(user);
	}, 60000);
}

BGTEngine.prototype.keepAliveUser = function(user) {
	var me = this;
	if (this.userTimeouts[user]) clearTimeout(this.userTimeouts[user]);
	this.userTimeouts[user] = setTimeout(function(){
		console.log('user ' + user.uid + ': update timeout');
		me.removeUser(user);
	}, 60000);
}

BGTEngine.prototype.removeUser = function(user){
	delete this.users[user.uid];
	if (this.userTimeouts[user.uid]) clearTimeout(this.userTimeouts[user.uid]);
	this.sendUpdates({
		quit:'<user id="' + user.uid + '"/>'
	});
}

BGTEngine.prototype.addMapConnection = function(conn) {
	var me = this;
	this.connections.push(conn);
	conn.req.on('close', function() {
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

BGTEngine.prototype.sendCurrentLocations = function(res) {
	var output = '<?xml version="1.0" encoding="UTF-8" ?>\n';
	output += '<movements>' + this.getLocationXML(this.users) + '</movements>';
	res.write(output);
}

BGTEngine.prototype.sendLocationUpdates = function(user) {
	this.sendUpdates({
		movements:this.getLocationXML([user])
	});
}

BGTEngine.prototype.sendUpdates = function(updates) {
	var output = '<?xml version="1.0" encoding="UTF-8" ?>\n';
	for (var a in updates) {
		output += '<' + a + '>';
		output += updates[a];
		output += '</' + a + '>';
	}

	for (var i = 0; i < this.connections.length; i++) {
		this.connections[i].write(output);
	}
}

BGTEngine.prototype.getLocationXML = function(users) {
	output = '';
	for (var i in users) {
		user = users[i];
		output += '<user id="' + user.uid + '">';
		output += '<location><lat>' + user.location.lat + '</lat>';
		output += '<lon>' + user.location.lon + '</lon></location>';
		output += '</user>';
	}
	return output;
}
