BGTEvent = function(data){
	var me = this;
	this.subscribers = {};
	if (data) for (var a in data) {
		me[a] = data[a];
	}
	me.started = false;
	var date = new Date();
	setTimeout(function(){
		me.activate();
	}, this.start - 7500000 - date);
	
	var connections = [];

	me.registerConnection = function(conn){
		if (!this.isActive) throw new Error('Event is not open for control connections yet.');
		if (connections.indexOf(conn) >= 0) return;
		connections.push(conn);
		// restore last state on connection
		conn.sendCommand((this.started && !this.paused ? 'en' : 'dis') + 'ableGPS');
	};

	me.unregisterConnection = function(conn){
		var index;
		if ((index = connections.indexOf(conn)) < 0) return;
		connections.splice(index, 1);
	};

	var sendCommand = function(command){
		return function(){
			connections.forEach(function(conn){
				conn.sendCommand(command);
			});
		};
	};

	this.on('start', sendCommand('enableGPS'));
	this.on('end', sendCommand('shutdown'));
	this.on('pause', sendCommand('disableGPS'));
	this.on('resume', sendCommand('enableGPS'));
};

var util = require('util');

util.inherits(BGTEvent, require('events').EventEmitter);

BGTEvent.events = [];

BGTEvent.loadAll = function(callback) {
	var me = this;
	db.query()
		.select('event.id as id, event.title, start, end, map, weather, map.title as mapName')
		.from('event')
		.join({table:'map', type:'left', conditions:'event.map = map.id'})
		.where('end >= ?', [new Date()])
		.execute(function(err, results){
			if (err) return callback(err);
			results.forEach(function(event){
				event = new BGTEvent(event);
				event.once('end', function(){
					delete me.events[event.id];
				});
				me.events[event.id] = event;
			});
			callback(me.events);
		});
}

BGTEvent.get = function(id) {
	if (this.events[id]) return this.events[id];
	throw new Error("Event not found");
};

BGTEvent.getAll = function() {
	var result = [];
	for (var a in this.events) result.push(this.events[a]);
	return result;
};

BGTEvent.prototype.isActive = function(){
	return this.active == true;
}

BGTEvent.prototype.doStart = function(){
	if (!this.isActive()) throw new Error('Event is not active yet.');
	if (this.paused) return this.resume();
	if (this.started) return;
	util.log('Starting event: ' + this.title);
	this.started = true;
	this.emit('start');
	var me = this;
	var date = new Date();
	setTimeout(function(){
		me.doEnd();
	}, this.end - date);
};

BGTEvent.prototype.doEnd = function(){
	if (!this.isActive()) throw new Error('Event is not active yet.');
	if (!this.started) return;
	this.started = false;
	this.emit('end');
	util.log('Event ended: ' + this.title);
};

BGTEvent.prototype.pause = function(){
	if (!this.isActive()) throw new Error('Event is not active yet.');
	if (this.paused) return;
	util.log('Pausing event: ' + this.title);
	this.emit('pause');
	this.paused = true;
};

BGTEvent.prototype.resume = function(){
	if (!this.isActive()) throw new Error('Event is not active yet.');
	if (!this.paused) return;
	util.log('Resuming event: ' + this.title);
	this.emit('resume');
	this.paused = false;
};

BGTEvent.prototype.activate = function(){
	var me = this;
	me.active = true;
};

BGTEvent.prototype.setWeatherDecision = function(decision, callback){
	if (this.weather == decision) return callback(true);
	this.weather = decision;
	BGT.messenger.sendBroadcastMessage({
		eventId:this.id,
		title:this.title,
		weather:this.weather
	}, function(response){
		if (util.isError(response)) util.log('Error sending message via GCM:\n' + response.stack);
	});
	db.query().update('event').set({weather:this.weather}).where('id = ?', [this.id]).execute(function(err, result){
		if (callback) callback(err ? err : true);
	});
};

BGTEvent.prototype.update = function(data, callback){
	for (var a in data) switch (a) {
		case "weather":
			return this.setWeatherDecision(data[a], callback);
	}
};

BGTEvent.prototype.getEngine = function(){
	var me = this;
	if (!me._engine) {
		me._engine = new BGTEngine()
		BGTMap.getMap(me.map, function(map){
			if (util.isError(map)) return util.log('Error loading map ' + me.map + ':\n' + map.stack);
			me._engine.setMap(map);
		});
		var relayEvent = function(source, name){
			source.on(name, function(data){
				data.eventId = me.id;
				me.emit(name, data);
			});
		};
		['stats', 'movements', 'map', 'quit'].forEach(function(name){
			relayEvent(me._engine, name);
		});
	}
	return me._engine;
};

BGTEvent.prototype.emit = function(name){
	BGTEvent.super_.prototype.emit.apply(this, arguments);
	var orig = arguments;
	if (this.subscribers[name]) this.subscribers[name].forEach(function(sub){
		sub.receiveEvent.apply(sub, orig);
	});
};

BGTEvent.prototype.toJSON = function(){
	var res = {}, me = this;
	(['id', 'title', 'start', 'end', 'map', 'weather', 'mapName']).forEach(function(idx){
		res[idx] = me[idx];
	});
	return res;
};

BGTEvent.prototype.subscribe = function(subscriber, category){
	var me = this;
	if (category instanceof Array) return category.forEach(function(category){
		me.subscribe(subscriber, category);
	});
	if (!this.subscribers[category]) this.subscribers[category] = [];
	var subscriptions = this.subscribers[category];
	if (subscriptions.indexOf(subscriber) >= 0) return;
	subscriptions.push(subscriber);
	me.getEngine().getCurrentData(category, function(current){
		if (current) subscriber.receiveEvent(category, current);
	});
};

BGTEvent.prototype.unsubscribe = function(subscriber, category){
	var me = this;
	if (category instanceof Array) return category.forEach(function(category){
		me.unsubscribe(subscriber, category);
	});
	if (!this.subscribers[category]) return;
	var subscriptions = this.subscribers[category];
	var index = subscriptions.indexOf(subscriber);
	if (index < 0) return;
	subscriptions.splice(index, 1);
};
