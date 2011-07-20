BGTEngine = function(){
	this.locations = {};
	this.connections = [];
	this.userTimeouts = {};
}

BGTEngine.prototype.loadModule = function(request) {
	var module = require('./modules/' + request.module);
	return module;
}

BGTEngine.prototype.updateUserLocation = function(user, location) {
	var me = this;
	this.locations[user] = location;
	this.sendLocationUpdates(user);
	if (this.userTimeouts[user]) clearTimeout(this.userTimeouts[user]);
	this.userTimeouts[user] = setTimeout(function(){
		console.log('user ' + user + ': update timeout');
		me.removeUser(user);
	}, 60000);
}

BGTEngine.prototype.keepAliveUser = function(user) {
	var me = this;
	if (this.userTimeouts[user]) clearTimeout(this.userTimeouts[user]);
	this.userTimeouts[user] = setTimeout(function(){
		console.log('user ' + user + ': update timeout');
		me.removeUser(user);
	}, 60000);
}

BGTEngine.prototype.removeUser = function(user){
	delete this.locations[user];
	if (this.userTimeouts[user]) clearTimeout(this.userTimeouts[user]);
	this.sendUpdates({
		quit:'<user id="' + user + '"/>'
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
	var users = [];
	for (var a in this.locations) users.push(a);	

	output += '<movements>' + this.getLocationXML(users) + '</movements>';
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
	for (var i = 0; i < users.length; i++) {
		user = users[i];
		output += '<user id="' + user + '">';
		output += '<location><lat>' + this.locations[user].lat + '</lat>';
		output += '<lon>' + this.locations[user].lon + '</lon></location>';
		output += '</user>';
	}
	return output;
}
