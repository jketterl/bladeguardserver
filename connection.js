BGTConnection = function(req, res) {
	this.req = req;
	this.res = res;
}

BGTConnection.prototype.write = function() {
	this.res.write.apply(this.res, arguments);
	this.setTimeout();
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
}
