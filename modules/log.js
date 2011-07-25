var querystring = require('querystring');

this.process = function(request) {
	if (request.uid && request.lat && request.lon) {
		request.res.writeHead(200);
		request.res.end('log module successful');
		engine.updateUserLocation(engine.getUser(request.uid), new BGTLocation({lat:request.lat, lon:request.lon}));
		return;
	}
	request.req.on('end', function() {
		engine.removeUser(request.user);
	});
	request.req.on('close', function() {
		engine.removeUser(request.user);
	});
	request.req.on('data', function(chunk) {
		chunk = chunk.toString();
		if (request.timeout) clearTimeout(request.timeout);
		if (chunk == 'quit' || chunk == 'gpsunavailable') {
			console.log('received ' + chunk + ' for uid ' + request.user.uid);
			engine.removeUser(request.user);
			request.res.end('connection closed');
			return;
		} else if (chunk == 'keepalive') {
			engine.keepAliveUser(request.user);
		} else {
			var data = querystring.parse(chunk);
			if (data.uid) {
				console.log('identified user: ' + data.uid);
				request.user = engine.getUser(data.uid);
			}
			if (data.lat && data.lon) {
				console.log('received update for uid ' + request.user.uid + ': ' + chunk);
				engine.updateUserLocation(request.user, new BGTLocation(data));
			}
		}
		request.res.write('ACK');
		request.timeout = setTimeout(function(){
			console.info('connection for uid ' + request.user.uid + ' timed out');
			request.res.end();
		}, 60000);
	});
}
