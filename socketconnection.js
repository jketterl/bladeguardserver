var util = require('util');

BGTSocketConnection = function(socket){
	var me = this;
	me.socket = socket;
	me.socket.on('close', function(){
		me.emit('close');
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
