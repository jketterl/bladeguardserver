BGTConnection = function(request) {
	var me = this;
	this.request = request;
	this.updates = [];
	me.request.req.on('close', function(){
		me.emit('close');
	});
	// send updates in 5s intervals
	this.writeInterval = setInterval(function(){
		var updates = me.updates; me.updates = [];
		me.sendUpdates(updates);
	}, 5000);
	this.sendUpdates(new BGTUpdate('noop', {}));
}

var util = require('util');
util.inherits(BGTConnection, require('events').EventEmitter);

BGTConnection.prototype.write = function() {
	this.request.res.write.apply(this.request.res, arguments);
	this.setTimeout();
}

BGTConnection.prototype.sendUpdates = function(updates) {
	if (typeof(updates) != 'object' ) throw "unsupported value";
	if (!(updates instanceof Array)) {
		return this.sendUpdates([updates]);
	}
	var xml = this.getUpdateXML(updates);
	if (xml == '') return;
	var output = '<?xml version="1.0" encoding="UTF-8" ?>\n' +
		     '<updates>' + xml + '</updates>';
	this.write(output);
}

BGTConnection.prototype.getUpdateXML = function(updates) {
	var sorted = {};
	for (var i in updates) {
		var category = updates[i].getCategory();
		if (typeof(sorted[category]) != 'undefined') {
			sorted[category].push(updates[i]);
		} else {
			sorted[category] = [updates[i]];
		}
	}

	var output = '';
	for (var a in sorted) {
		output += '<' + a + '>';
		for (var i in sorted[a]) {
			var update = sorted[a][i];
			if (update.isApplicable(this)) output += update;
		}
		output += '</' + a + '>';
	}
	return output;
}

BGTConnection.prototype.queueUpdates = function(updates) {
	for (var a in updates) {
		this.updates.push(updates[a]);
	}
}

BGTConnection.prototype.setTimeout = function() {
	if (this.timeout) clearTimeout(this.timeout);
	var me = this;
	this.timeout = setTimeout(function(){
		me.write('<?xml version="1.0" encoding="UTF-8" ?>\n<keepalive/>');
	}, 30000);
}

BGTConnection.prototype.close = function() {
	if (this.timeout) clearTimeout(this.timeout);
	if (this.writeInterval) clearInterval(this.writeInterval);
}

BGTConnection.prototype.getUser = function(){
	return this.request.session.getData().user;
};
