var util = require('util');

BGTSocketConnection = function(socket){
	var me = this;
	me.socket = socket;
	me.socket.on('close', function(){
		me.emit('close');
	});
	me.socket.on('message', function(message){
		me.parseMessage(message);
	});
	me.subscribed = [];
}

util.inherits(BGTSocketConnection, require('events').EventEmitter);

BGTSocketConnection.prototype.sendUpdates = function(updates){
	if (!(updates instanceof Array)) return this.sendUpdates([updates]);
	var me = this,
	    sorted;

	for (var i in updates) {
		var update = updates[i],
		    category = update.getCategory();
		if (!this.isSubscribed(category)) continue;
		if (!update.isApplicable(this)) continue;
		sorted = sorted || {};
		if (typeof(sorted[category]) != 'undefined') {
			sorted[category].push(update);
		} else {
			sorted[category] = [update];
		}
	}

	if (!sorted) return;
	me.socket.sendUTF(JSON.stringify({event:'update', data:sorted}));
};

BGTSocketConnection.prototype.close = function(){};

BGTSocketConnection.prototype.parseMessage = function(message){
	var me = this,
	    callback = function(success){
		var response = {success:true};
		if (typeof(success) == 'boolean') response.success = success;
		if (util.isError(success)) {
			response.success = false;
			response.data = {
				message:success.message
			};
		} else {
			response.data = success;
		}
		if (typeof(data.requestId) != 'undefined') response.requestId = data.requestId;
		me.socket.sendUTF(JSON.stringify(response));
	};
	if (message.type != 'utf8') {
		util.warn('unsupported message type: "' + message.type + '"');
		return callback(new Error('unsupported message type: "' + message.type + '"'));
	}
	var data = false;
	try {
		data = JSON.parse(message.utf8Data);
	} catch (e) {
		return callback(false);
	}
	if (!data.command) {
		util.log('message could not be parsed (no command)');
		return callback(new Error('message could not be parsed (no command)'));
	}
	var fn = this['process' + data.command.charAt(0).toUpperCase() + data.command.slice(1)];
	if (typeof(fn) != 'function') {
		util.log('unknown command: "' + data.command + '"');
		return callback(new Error('unknown command: "' + data.command + '"'));
	}
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

BGTSocketConnection.prototype.processGpsUnavailable = function(data){
	this.emit('quit');
};

BGTSocketConnection.prototype.processSubscribeUpdates = function(data){
	if (!data.category || this.isSubscribed(data.category)) return;
	this.subscribed.push(data.category);
	var updates = engine.getCurrentData(data.category);
	if (updates) this.sendUpdates(updates);
};

BGTSocketConnection.prototype.processUnSubscribeUpdates = function(data){
	if (!data.category || !this.isSubscribed(data.category)) return;
	this.subscribed.splice(this.subscribed.indexOf(data.category), 1);
};

BGTSocketConnection.prototype.processGetMaps = function(data){
	if (!this.getUser().isAdmin()) return new Error('only admin users are allowed to list maps.');
	result = [];
	for (var i in BGTMap.maps) {
		result.push({id:i,name:BGTMap.maps[i]});
	}
	return result;
}

BGTSocketConnection.prototype.processSetMap = function(data){
	if (!this.getUser().isAdmin()) return new Error('only admin users can switch the map');
	if (typeof(data.id) == 'undefined') return new Error("Missing map id!");
	engine.setMap(BGTMap.getMap(data.id));
};

BGTSocketConnection.prototype.isSubscribed = function(category){
	return this.subscribed.indexOf(category) >= 0;
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
