var querystring = require('querystring');
var util = require('util');

this.process = function(request) {
	if (request.session && request.session.getData().user) {
		request.user = request.session.getData().user;
	} else {
		// anonymous connection
		request.user = BGTUser.getAnonymousUser();
		util.log('new anonymous user: ' + request.user);
	}
	if (request.lat && request.lon) {
		if (!request.session || !request.session.getData().user) {
			BGTSession.newSession({user:request.user});
		}
		engine.updateUserLocation(request.user, new BGTLocation({lat:request.lat, lon:request.lon}));
		request.res.writeHead(200);
		request.res.end('log module successful');
		return;
	}
	request.req.on('end', function() {
		if (request.user) engine.removeUser(request.user);
	});
	request.req.on('close', function() {
		if (request.user) engine.removeUser(request.user);
	});
	var parseChunk = function(chunk) {
		var data = querystring.parse(chunk);
		if (request.timeout) clearTimeout(request.timeout);
		if (chunk == 'quit' || chunk == 'gpsunavailable') {
			util.log('received ' + chunk + ' for ' + request.user);
			engine.removeUser(request.user);
			request.res.end('connection closed');
			return;
		} else if (chunk == 'keepalive') {
			engine.keepAliveUser(request.user);
		} else if (data.lat && data.lon) {
			util.log('received update for ' + request.user + ': ' + chunk);
			engine.updateUserLocation(request.user, new BGTLocation(data));
		}
		request.timeout = setTimeout(function(){
			util.log('connection for ' + request.user + ' timed out');
			request.res.end();
		}, 60000);
	};
	request.req.on('data', function(chunk) {
		parseChunk(chunk.toString());
	});
}
