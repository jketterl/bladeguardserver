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

	me.registerConnection = function(conn, allowEarly){
        // allowEarly is set on android versions up to build #15 and indicates that the client is not able to be activated via push message.
        // isActive() will be set 2 hours before the planned start whereas started will only be set when the event has been actually started by an admin.
        if (allowEarly) {
            if (!me.isActive()) throw new Error('Event is not open for control connections yet.');
        } else {
            if (!me.started) throw new Error('Event has not been started yet.');
        }
		if (connections.indexOf(conn) >= 0) return;
		connections.push(conn);
		conn.on('close', function(){
			me.unregisterConnection(conn);
		});
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

	this.on('start', function(){
        sendCommand('enableGPS')();
        BGT.messenger.sendBroadcastMessage({
            type:'eventstart',
            eventId:me.id
        }, function(err) {
            if (util.isError(err)) util.log('push message failed:\n' + err.stack);
        });
    });
	this.on('end', sendCommand('shutdown'));
	this.on('pause', sendCommand('disableGPS'));
	this.on('resume', sendCommand('enableGPS'));
};

var util = require('util'),
    async = require('async');

util.inherits(BGTEvent, require('events').EventEmitter);

BGTEvent.events = [];

BGTEvent.loadAll = function(callback) {
	var me = this;
	db.query()
		.select('event.id as id, event.title, start, end, map, weather, map.title as mapName, actual_start as actualStart, actual_end as actualEnd')
		.from('event')
		.join({table:'map', type:'left', conditions:'event.map = map.id'})
		.execute(function(err, results){
			if (err) return callback(err);
			results.forEach(function(event){
				event = new BGTEvent(event);
				me.events[event.id] = event;
			});
			callback(me.events);
		});
}

BGTEvent.get = function(id) {
	if (this.events[id]) return this.events[id];
	throw new Error("Event not found");
};

BGTEvent.getAll = function(includingOld) {
	var result = [];
	var now = new Date();
	for (var a in this.events) {
		var event = this.events[a];
		if (includingOld || (event.actualEnd == null && event.end >= now)) result.push(this.events[a]);
	}
	return result;
};

BGTEvent.addEvent = function(event, callback) {
	event.store(function(event){
		BGTEvent.events[event.id] = event;
		callback(event);
	});
};

BGTEvent.prototype.store = function(callback){
	var me = this,
	    query = db.query();
	if (me.id) {
		query.update('event').set({
			title:me.title,
			start:me.start,
			end:me.end,
			map:me.map,
			weather:me.weather,
			actual_start:me.actualStart,
			actual_end:me.actualEnd
		}).where('id = ?', [me.id]);
	} else {
		query.insert('event',
			['title', 'start', 'end', 'map', 'weather'],
			[me.title, me.start, me.end, me.map, me.weather]
		);
	}
	query.execute(function(err, result){
		if (err) return callback(err);
		if (!me.id) me.id = result.id;
		db.query().select('title').from('map').where('id = ?', [me.map]).execute(function(err, result){
			if (err) return callback(err);
			me.mapName = result[0].title;
			if (callback) callback(me);
		});
	});
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
	me.getEngine().stats.start();
	me.actualStart = new Date();
	me.store();
	var date = new Date();
	var wait = this.end - date;
	// setTimeout will only work with 32bit integers. this is a very unlikely case, i'm only handling it
	// since i stumbled across it in development.
	if (wait >= Math.pow(2, 31)) return;

	setTimeout(function(){
		me.doEnd();
	}, wait);

    db.query().select(['fb_post_id'])
        .from('participation')
        .where('event_id = ?', [ me.id ])
        .and('fb_post_id is not null')
        .execute(function(error, rows){
            if (error) return util.log('error querying participations:\n' + error);
            rows.forEach(function(row){
                BGT.Facebook.updateStory(row.fb_post_id, { start_time: moment(me.actualStart).toISOString() }, function(err){
                    if (err) util.log('error updating story:\n' + err.stack);
                });
            });
        });
};

BGTEvent.prototype.doEnd = function(){
	var me = this;
	if (!this.isActive()) throw new Error('Event is not active yet.');
	if (!this.started) return;
	this.started = false;
	me.actualEnd = new Date();
	me.store();
	this.getEngine().stats.stop();
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
        type:'weather',
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
    var me = this,
        fns = [],
        identity = function(val) { return val; },
        toDate = function(val) { return new Date(val); },
        mappings = {
            weather: function(val) {
				fns.push(function(callback) { me.setWeatherDecision(val, callback); } );
            },
            map: function(val) {
				fns.push(function(callback) { me.setMap(val, callback); } );
            },
            start: toDate,
            end: toDate,
            title: identity
        };
	for (var a in data) {
		var val = data[a];
        if (mappings[a]) {
            var mapped = mappings[a](val);
            if (typeof(mapped) != 'undefined') me[a] = mapped;
        }
	}
    async.parallel(fns, function(){
        me.store(callback);
    });
};

BGTEvent.prototype.getEngine = function(){
	var me = this;
	if (!me._engine) {
		me._engine = new BGTEngine(me);
		me.setMap(me.map, function(map){
			if (util.isError(map)) util.log('Error loading map ' + me.map + ':\n' + map.stack);
		});
		var relayEvent = function(source, name){
			source.on(name, function(update){
				update.setEvent(me);
				me.emit(name, update);
			});
		};
		['stats', 'movements', 'map', 'quit'].forEach(function(name){
			relayEvent(me._engine, name);
		});
	}
	return me._engine;
};

BGTEvent.prototype.setMap = function(mapId, callback){
	var me = this;
	BGTMap.getMap(mapId, function(map){
		if (util.isError(map)) return callback(map);
		me.getEngine().setMap(map);
		if (me.map == mapId) return callback();

		me.map = mapId;
		me.mapName = map.name;
		me.store(function(){
			callback();
		});
	});
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
	(['id', 'title', 'start', 'end', 'map', 'weather', 'mapName', 'actualStart', 'actualEnd']).forEach(function(idx){
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

	subscriber.on('close', function(){
		me.unsubscribe(subscriber, category);
	});

	me.getEngine().getCurrentData(category, function(current){
		if (!current) return;
		if (util.isError(current)) return console.warn(current);
		if (Array.isArray(current)) {
			current.forEach(function(current){
				current.setEvent(me);
			});
		} else {
			current.setEvent(me);
		}
		subscriber.receiveEvent(category, current);
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
