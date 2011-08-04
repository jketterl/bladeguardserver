var crypto = require('crypto');
var querystring = require('querystring');
var util = require('util');

BGTSession = function(key, data) {
	this.key = key;
	this.data = data;
}

BGTSession.prototype.getData = function() {
	return this.data;
}

BGTSession.prototype.setData = function(data) {
	this.data = data;
}

BGTSession.newSession = function(data) {
	var key;
	do {
		key = crypto.createHash('md5').update('session' + Math.random()).digest('hex');
	} while(BGTSession.sessions[key]);
	var session = new BGTSession(key, data || {});
	BGTSession.sessions[key] = session;
	return session;
}

BGTSession.getSession = function(key) {
	return BGTSession.sessions[key];
}

BGTSession.processRequest = function(request) {
	var session;
	if (request.req.headers.cookie) {
		var cookies = querystring.parse(request.req.headers.cookie, ';');
		if (cookies.BGTSESSION) {
			session = BGTSession.getSession(cookies.BGTSESSION);
		}
	}
	if (session) {
		util.log('session reconnected');
	} else {
		util.log('issuing new session');
		session = BGTSession.newSession();
		request.res.setHeader('Set-Cookie', ['BGTSESSION=' + session.key + '; path=/bgt']);
	}
	request.session = session;
}

BGTSession.sessions = [];
