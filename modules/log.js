var querystring = require('querystring');
var util = require('util');

this.process = function(request) {
	if (request.uid && request.lat && request.lon) {
		request.res.writeHead(200);
		request.res.end('log module successful');
		engine.updateUserLocation(engine.getUser(request.uid), new BGTLocation({lat:request.lat, lon:request.lon}));
		return;
	}
	request.req.on('end', function() {
		if (request.user) engine.removeUser(request.user);
	});
	request.req.on('close', function() {
		engine.removeUser(request.user);
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
			if (!request.user) {  }
			engine.keepAliveUser(request.user);
		} else if (data.lat && data.lon) {
			util.log('received update for ' + request.user + ': ' + chunk);
			engine.updateUserLocation(request.user, new BGTLocation(data));
		}
		request.res.write('ACK');
		request.timeout = setTimeout(function(){
			util.log('connection for ' + request.user + ' timed out');
			request.res.end();
		}, 60000);
	};
	request.req.on('data', function(chunk) {
		chunk = chunk.toString();
		var data = querystring.parse(chunk);
		// authenticate user first
		if (data.uid && data.pass) {
			request.authenticating = true;
			util.log('processing user identification: "' + data.uid + '"');
			BGTUser.login(data.uid, data.pass, function(err, user){
				if (err) {
					util.log(err);
					request.res.end('authentication failure: ' + err);
					return;
				}
				util.log('user logged in: ' + user);
				engine.addUser(user);
				request.user = user;
				if (!request.queue) return;
				for (var i = 0; i < request.queue.length; i++) parseChunk(request.queue[i]);
				delete request.queue;
			});
			return;
		}
		// no user given?
		if (!request.user) {
			if (request.authenticating) {
				//authentication has been requested and is waiting to be finished; form a queue
				request.queue = request.queue || [];
				request.queue.push(chunk);
				return;
			} else {
				// anonymous connection
				request.user = engine.getAnonymousUser();
				util.log('new anonymous user: ' + request.user);
			}
		}
		parseChunk(chunk);
	});
}
