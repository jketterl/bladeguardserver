BGTEngine = function(){
	this.locations = {};
	this.connections = [];
}

BGTEngine.prototype.loadModule = function(request) {
	var module = require('./modules/' + request.module);
	return module;
}

BGTEngine.prototype.updateUserLocation = function(user, location) {
	this.locations[user] = location;
	this.sendUpdates(user);
}

BGTEngine.prototype.addMapConnection = function(res) {
	this.connections.push(res);
}

BGTEngine.prototype.sendUpdates = function(user) {
	for (var i = 0; i < this.connections.length; i++) {
		var output = '<?xml version="1.0" encoding="UTF-8" ?>\n';
		output += '<movements><user id="' + user + '">';
		output += '<location><lat>' + this.locations[user].lat + '</lat>';
		output += '<lon>' + this.locations[user].lon + '</lon></location>';
		output += '</user></movements>';
		this.connections[i].write(output);
	}
}
