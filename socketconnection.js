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
	var me = this;
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
	return this['process' + data.command](data.data || {}, function(success){
		var response = {success:true};
		if (typeof(success) == 'boolean') response.success = success;
		if (util.isError(success)) {
			response.success = false;
			response.data = {
				message:success.message
			};
		}
		if (data.requestId) response.requestId = data.requestId;
		me.socket.sendUTF(JSON.stringify(response));
	});
};

BGTSocketConnection.prototype.processlog = function(data, callback){
	this.emit('location', new BGTLocation(data));
	process.nextTick(callback);
};

BGTSocketConnection.prototype.processauth = function(data, callback){
	var me = this;
	if (!data.user || !data.pass) {
		util.log('login attempt with missing credentials - denied');
		return process.nextTick(function(){
			callback(false);
		});
	}
	BGTUser.login(data.user, data.pass, function(err, user){
		if (err) {
			util.log(err);
			return callback(err);
		}
		util.log('user login: ' + user);
		me.setUser(user);
		callback(true);
	});
};

BGTSocketConnection.prototype.setUser = function(user){
	this.user = user;
	return this;
}

BGTSocketConnection.prototype.getUser = function(){
	if (!this.user) {
		this.user = BGTUser.getAnonymousUser();
		util.log('new anonymous user: ' + this.user);
	}
	return this.user;
};
