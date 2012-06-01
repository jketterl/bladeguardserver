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
	var me = this,
	    sorted = {};

	for (var i in updates) {
		var category = updates[i].getCategory();
		if (typeof(sorted[category]) != 'undefined') {
			sorted[category].push(updates[i]);
		} else {
			sorted[category] = [updates[i]];
		}
	}

	me.socket.sendUTF(JSON.stringify(sorted));
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
	var fn = this['process' + data.command.charAt(0).toUpperCase() + data.command.slice(1)];
	if (typeof(fn) != 'function') {
		console.warn('unknown command:"' + data.command + '"');
		return false;
	}
	var callback = function(success){
		var response = {success:true};
		if (typeof(success) == 'boolean') response.success = success;
		if (util.isError(success)) {
			response.success = false;
			response.data = {
				message:success.message
			};
		}
		if (typeof(data.requestId) != 'undefined') response.requestId = data.requestId;
		me.socket.sendUTF(JSON.stringify(response));
	};
	if (fn.length > 1) {
		return fn.apply(this, [data.data || {}, callback]);
	} else {
		return callback(fn.apply(this, [data.data || {}]));
	}
};

BGTSocketConnection.prototype.processLog = function(data){
	this.emit('location', new BGTLocation(data));
};

BGTSocketConnection.prototype.processAuth = function(data, callback){
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

BGTSocketConnection.prototype.processQuit = function(data){
	this.emit('quit');
};

BGTSocketConnection.prototype.setUser = function(user){
	this.user = user;
	return this;
};

BGTSocketConnection.prototype.getUser = function(){
	if (!this.user) {
		this.user = BGTUser.getAnonymousUser();
		util.log('new anonymous user: ' + this.user);
	}
	return this.user;
};
