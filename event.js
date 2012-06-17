BGTEvent = function(data){
	var me = this;
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
	db.query().select('id, title, start, end').from('event').where('start >= ?', [new Date()]).execute(function(err, results){
		if (err) return callback(err);
		results.forEach(function(event){
			event = new BGTEvent(event);
			event.once('end', function(){
				me.events.splice(event.id, 1);
			});
			me.events[event.id] = event;
		});
		callback();
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
	if (!this.started) return;
	this.started = false;
	this.emit('end');
	util.log('Event ended: ' + this.title);
};

BGTEvent.prototype.pause = function(){
	if (this.paused) return;
	util.log('Pausing event: ' + this.title);
	this.emit('pause');
	this.paused = true;
};

BGTEvent.prototype.resume = function(){
	if (!this.paused) return;
	util.log('Resuming event: ' + this.title);
	this.emit('resume');
	this.paused = false;
};

BGTEvent.prototype.activate = function(){
	this.active = true;
	// TODO: load map
};
