BGTEvent = function(data){
	var me = this;
	if (data) for (var a in data) {
		me[a] = data[a];
	}
	me.started = false;
	var date = new Date();
	setTimeout(function(){
		me.doStart();
	}, this.start - date);
	//this.connections = [];
};

var util = require('util');

util.inherits(BGTEvent, require('events').EventEmitter);

BGTEvent.events = [];

BGTEvent.loadAll = function(callback) {
	var me = this;
	db.query().select('id, title, start, end').from('event').where('start >= ?', [new Date()]).execute(function(err, results){
		if (err) return callback(err);
		results.forEach(function(event){
		//for (var i = 0; i < results.length; i++) {
			//var event = new BGTEvent(results[i]);
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

BGTEvent.prototype.registerConnection = function(conn){
	//if (this.connections.indexOf(conn) >= 0) return;
	//this.connections.push(conn);
	if (this.started) {
		conn.sendCommand('enableGPS');
	} else {
		this.once('start', function(){
			conn.sendCommand('enableGPS');
		})
	}
	this.once('end', function(){
		conn.sendCommand('shutdown');
	});
};

BGTEvent.prototype.doStart = function(){
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
