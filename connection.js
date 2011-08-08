BGTConnection = function(request) {
	var me = this;
	this.request = request;
	this.updates = {};
	// send updates in 5s intervals
	this.writeInterval = setInterval(function(){
		var updates = me.updates; me.updates = {};
		me.sendUpdates(updates);
	}, 5000);
}

BGTConnection.prototype.write = function() {
	this.request.res.write.apply(this.request.res, arguments);
	this.setTimeout();
}

BGTConnection.prototype.sendUpdates = function(updates) {
	var xml = this.getUpdateXML(updates);
	if (xml == '') return;
	var output = '<?xml version="1.0" encoding="UTF-8" ?>\n' +
		     '<updates>' + xml + '</updates>';
	this.write(output);
}

BGTConnection.prototype.getUpdateXML = function(updates) {
	var output = '';
	for (var a in updates) {
		output += '<' + a + '>';
		for (var i in updates[a]) {
			var update = updates[a][i];
			if (update.isApplicable(this)) output += updates[a][i];
		}
		output += '</' + a + '>';
	}
	return output;
}

BGTConnection.prototype.queueUpdate = function(updates) {
	for (var a in updates) {
		if (updates[a].length == 0) continue;
		for (var i in updates[a]) {
			var update = updates[a][i];
			if (typeof(this.updates[a]) != 'undefined') {
				this.updates[a].push(update);
			} else {
				this.updates[a] = [update];
			}
		}
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
