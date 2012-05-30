var util = require('util');

BGTSocketConnection = function(socket){
	var me = this;
	me.socket = socket;
	me.socket.on('close', function(){
		me.emit('close');
	});
	me.socket.on('message', function(message){
		me.processMessage(message);
	});
}

util.inherits(BGTSocketConnection, require('events').EventEmitter);

BGTSocketConnection.prototype.sendUpdates = function(updates){
	var me = this;
	updates.forEach(function(update){
		me.socket.sendUTF(update.toString());
	});
};

BGTSocketConnection.prototype.queueUpdates = function(updates){
	if (!(updates instanceof Array)) return this.queueUpdates([updates]);
	this.sendUpdates(updates);
};

BGTSocketConnection.prototype.close = function(){};

BGTSocketConnection.prototype.processMessage = function(message){
	if (message.type != 'utf8') {
		console.warn('unsupported message type: "' + message.type + '"');
		return false;
	}
	var data = false;
	try {
		data = JSON.parse(message.utf8Data);
	} catch (e) {
		return false;
	}
	if (!data.command) {
		console.warn('message could not be parsed (no command)');
		return false;
	}
	if (typeof(this['process' + data.command]) != 'function') {
		console.warn('unknown command:"' + data.command + '"');
		return false;
	}
	return this['process' + data.command](data.data);
}

BGTSocketConnection.prototype.processlog = function(data){
	this.emit('location', new BGTLocation(data));
}

BGTSocketConnection.prototype.getUser = function(){
	if (!this.user) {
		this.user = BGTUser.getAnonymousUser();
		util.log('new anonymous user: ' + this.user);
	}
	return this.user;
}
