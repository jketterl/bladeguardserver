var util = require('util'),
    crypto = require('crypto');

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
		var fn = this['process' + data.command.charAt(0).toUpperCase() + data.command.slice(1)];
	}
	if (typeof(fn) != 'function') {
		util.log('unknown command: "' + data.command + '"');
		return callback(new Error('unknown command: "' + data.command + '"'));
	}
	var params = [data.data || {}];
	if (fn.length > 1) params.push(callback);
	try {
		var res = fn.apply(this, params);
		if (fn.length <= 1) callback(res);
	} catch (e) {
		util.log('error processing user command "' + data.command + '":\n' + e.stack);
		callback(e);
	}
};

BGTSocketConnection.prototype.processLog = function(data, callback){
	var location = new BGTLocation(data);
	this.getUser().updateLocation(location);
	var engine = this.getEvent(data).getEngine();
	engine.updateUserLocation(this.getUser(), location, function(position){
		var result = {
			locked:false
		}
		if (position) {
			return engine.getMap(function(map){
				var stats = engine.stats.getLatestStats();
				if (stats.between) {
					result.distanceToEnd = map.getDistanceBetween(stats.between[0], position.index);
					result.distanceToFront = map.getDistanceBetween(position.index, stats.between[1]);
				}
				result.locked = true;
				result.index = position.index;
				callback(result);
			});
		}
		callback(result);
	});
};

BGTSocketConnection.prototype.processAuth = function(data, callback){
	var me = this;
	if (!data.user || !data.pass) {
		util.log('login attempt with missing credentials - denied');
		return process.nextTick(function(){
			callback(new Error("missing credentials"));
		});
	}
	BGTUser.login(data.user, data.pass, function(err, user){
		if (err) {
			util.log(err);
			return callback(err);
		}
		util.log('user login: ' + user);
		me.setUser(user);
		callback(user.toJSON());
	});
};

BGTSocketConnection.prototype.processQuit = function(data){
	this.getEvent(data).getEngine().removeUser(this.getUser());
};

BGTSocketConnection.prototype.processGpsUnavailable = function(data){
	this.processQuit(data);
};

BGTSocketConnection.prototype.processUpdateRegistration = function(data, callback){
	var me = this;
	var platform = 'android';
	if (me.handshake && me.handshake.platform) platform = me.handshake.platform;
	db.query().select('id').from('registration').where('platform = ? and registration_id = ?', [platform, data.regId]).execute(function(err, result){
		if (err) return callback(err);
		var user = me.getUser();
		var userId = user.anonymous ? null : user.uid;
		if (result.length) {
			db.query().update('registration').set({user_id:userId}).where('platform = ? and registration_id = ?', [platform, data.regId]).execute(function(err, result){
				callback(err ? err : true);
			});
		} else {
			db.query().insert('registration', ['registration_id', 'user_id', 'platform'], [data.regId, userId, platform]).execute(function(err, result){
				callback(err ? err : true);
			});
		}
	});
};

BGTSocketConnection.prototype.processUpdateEvent = function(data, callback){
	if (!this.getUser().isAdmin()) return callback(new Error('only admin users are allowed to start events'));
	if (typeof(data.eventId) == 'undefined') return callback(new Error('event id missing'));
	this.getEvent(data).update(data, callback);
};

BGTSocketConnection.prototype.processSubscribeUpdates = function(data){
	if (!data.category) return new Error('missing parameters');
	var event = this.getEvent(data);
	return event.subscribe(this, data.category);
};

BGTSocketConnection.prototype.processUnsubscribeUpdates = function(data){
	if (!data.category) return new Error('missing parameters');
	var event = this.getEvent(data);
	return event.unsubscribe(this, data.category);
};

BGTSocketConnection.prototype.processGetMaps = function(data, callback){
	if (!this.getUser().isAdmin()) return new Error('only admin users are allowed to list maps.');
	BGTMap.getMaps(callback);
}

BGTSocketConnection.prototype.processSetMap = function(data, callback){
	if (!this.getUser().isAdmin()) return callback(new Error('only admin users can switch the map'));
	if (typeof(data.id) == 'undefined') return callback(new Error("Missing map id!"));
	var engine = this.getEvent(data).getEngine();
	BGTMap.getMap(data.id, function(map){
		if (util.isError(map)) {
			util.log(map);
			return callback(map);
		}
		engine.setMap(map);
		callback(true);
	});
};

BGTSocketConnection.prototype.processGetTeams = function(data, callback){
	db.query().select('id, name').from('team').where('active').execute(function(err, rows){
		if (err) return callback(err);
		callback(rows);
	});
};

BGTSocketConnection.prototype.processSetTeam = function(data, callback){
	if (typeof(data.id) == 'undefined') process.nextTick(function(){
		callback(new Error('no team id provided'));
	});
	this.getUser().setTeam(data.id, callback);
};

BGTSocketConnection.prototype.processSignup = function(data, callback){
	if (typeof(data.user) == 'undefined') return callback(new Error('missing username'));
	if (typeof(data.pass) == 'undefined') return callback(new Error('missing password'));
	var hash = crypto.createHash('md5').update(data.pass).digest('hex');
	db.query().insert('users', ['name', 'pass'], [data.user, hash]).execute(function(err, result){
		if (err) {
			if (/^Duplicate entry .* for key/.test(err)) {
				return callback(new Error('Username already registered'));
			}
			return callback(err);
		}
		callback(true);
	});
};

BGTSocketConnection.prototype.processGetEvents = function(data){
	return BGTEvent.getAll();
};

BGTSocketConnection.prototype.processEnableControl = function(data){
	util.log("incoming control request");
	var me = this;
	this.getEvent(data).registerConnection(me);
	this.controlled = true;
};

BGTSocketConnection.prototype.processDisableControl = function(data){
	this.getEvent(data).unregisterConnection(this);
	util.log("control session ended");
	this.controlled = false;
};

BGTSocketConnection.prototype.processStartEvent = function(data){
	if (!this.getUser().isAdmin()) return new Error('only admin users are allowed to start events');
	if (typeof(data.eventId) == 'undefined') return new Error('event id missing');
	BGTEvent.get(data.eventId).doStart();
};

BGTSocketConnection.prototype.processPauseEvent = function(data){
	if (!this.getUser().isAdmin()) return new Error('only admin users are allowed to start events');
	if (typeof(data.eventId) == 'undefined') return new Error('event id missing');
	BGTEvent.get(data.eventId).pause();
};

BGTSocketConnection.prototype.processShutdownEvent = function(data){
	if (!this.getUser().isAdmin()) return new Error('only admin users are allowed to start events');
	if (typeof(data.eventId) == 'undefined') return new Error('event id missing');
	BGTEvent.get(data.eventId).doEnd();
};

BGTSocketConnection.prototype.processDisableBridges = function(data){
	if (!this.getUser().isAdmin()) return new Error('only admin users are allowed to start events');
	engine.disableBridges();
};

BGTSocketConnection.prototype.processEnableBridges = function(data){
	if (!this.getUser().isAdmin()) return new Error('only admin users are allowed to start events');
	engine.enableBridges();
};

BGTSocketConnection.prototype.processSelectEvent = function(data){
	if (!data.eventId) return new Error('missing event id');
	this._event = BGTEvent.get(data.eventId);
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

BGTSocketConnection.prototype.getEvent = function(data){
	if (data.eventId) try {
		return BGTEvent.get(data.eventId);
	} catch (e) {}
	if (this._event) return this._event;
	throw new Error("Unable to execute command: an event must be selected!")
}

BGTSocketConnection.prototype.processFacebookLogin = function(data, callback){
	var me = this;
	if (typeof(data.userId) == 'undefined') return callback(new Error('userId must be set'));
	BGTFacebookUser.login(data.userId, function(user){
		util.log('Facebook user login: ' + user);
		me.setUser(user);
		callback(user);
	});
};

BGTSocketConnection.prototype.processChangePassword = function(data, callback){
	if (typeof(data.pass) == 'undefined') return callback(new Error('pass must be set'));
	this.getUser().setPassword(data.pass, callback);
};

BGTSocketConnection.prototype.processGetUsers = function(data, callback){
	if (!this.getUser().isAdmin()) return callback(new Error('only admin users are allowed to start events'));
	BGTUser.getAll(function(err, users){
		callback(err ? err : users);
	});
};
