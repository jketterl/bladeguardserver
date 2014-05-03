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
	me.socket.on('error', function(e){
		util.log('WebSocket error:\n' + e);
		me.socket.close();
	});
}

util.inherits(BGTSocketConnection, require('events').EventEmitter);

BGTSocketConnection.prototype.sendUpdates = function(updates){
	if (!(updates instanceof Array)) return this.sendUpdates([updates]);
	var me = this,
	    send = function(){
		if (!me.sorted) return;
		me.socket.sendUTF(JSON.stringify({event:'update', data:me.sorted}));
		me.sorted = false;
	};

	for (var i in updates) {
		var update = updates[i],
		    category = update.getCategory();
		if (!update.isApplicable(this)) continue;
		if (!me.sorted) {
			me.sorted = {};
			if (me.handshake) setTimeout(send, 200);
		}
		if (typeof(me.sorted[category]) != 'undefined') {
			me.sorted[category].push(update);
		} else {
			me.sorted[category] = [update];
		}
	}

	if (me.handshake) return;
	send();
};

BGTSocketConnection.prototype.receiveEvent = function(name, update){
	this.sendUpdates(update);
};

BGTSocketConnection.prototype.sendCommand = function(command, data) {
	this.socket.sendUTF(JSON.stringify({command:command, data:data || {}}));
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
            if (data && typeof(data.requestId) != 'undefined') response.requestId = data.requestId;
            me.socket.sendUTF(JSON.stringify(response));
        };
	if (message.type != 'utf8') {
		util.log('unsupported message type: "' + message.type + '"');
		console.info(message);
		return callback(new Error('unsupported message type: "' + message.type + '"'));
	}
	var data = false;
	try {
		data = JSON.parse(message.utf8Data);
	} catch (e) {
		return callback(false);
	}
	if (data.handshake) {
		this.handshake = data.handshake;
		util.log('handshake: ' + JSON.stringify(data.handshake));
		return callback(true);
	}
	if (!data.command) {
		util.log('message could not be parsed (no command)');
		return callback(new Error('message could not be parsed (no command)'));
	}
	if (typeof(data.command) != 'string') {
		util.log('message could not be parsed (command is of type "' + typeof(data.command) + '", string expected)');
		return callback(new Error('message could not be parsed (command is of type "' + typeof(data.command) + '", string expected)'));
	}
	try {
		fn = require(__dirname + '/commands/' + data.command);
	} catch (e) {
		util.log('unknown command: "' + data.command + '"');
		return callback(new Error('unknown command: "' + data.command + '"'));
	}
	var params = [data.data || {}];
	if (fn.length > 1) params.push(function(err){
        if (util.isError(err)) util.log('error processing user command "' + data.command + '":\n' + err.stack);
        callback.apply(this, arguments);
    });
	try {
		var res = fn.apply(this, params);
		if (fn.length <= 1) callback(res);
	} catch (e) {
		util.log('error processing user command "' + data.command + '":\n' + e.stack);
		callback(e);
	}
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

BGTSocketConnection.prototype.getUserType = function(user){
    if (user instanceof BGTFacebookUser) return 'fb';
    return 'bgt';
};

BGTSocketConnection.prototype.getEvent = function(data){
	if (data.eventId || data.id) try {
		return BGTEvent.get(data.eventId || data.id);
	} catch (e) {}
	if (this._event) return this._event;
	throw new Error("Unable to execute command: an event must be selected!")
};
