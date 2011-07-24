var querystring = require('querystring');

this.process = function(request) {
	if (request.uid && request.lat && request.lon) {
		request.res.writeHead(200);
		request.res.end('log module successful');
		engine.updateUserLocation(request.uid, {lat:request.lat, lon:request.lon});
		return;
	}
	request.req.on('end', function() {
		engine.removeUser(request.uid);
	});
	request.req.on('close', function() {
		engine.removeUser(request.uid);
	});
	request.req.on('data', function(chunk) {
		chunk = chunk.toString();
		if (request.timeout) clearTimeout(request.timeout);
		if (chunk == 'quit' || chunk == 'gpsunavailable') {
			console.log('received ' + chunk + ' for uid ' + request.uid);
			engine.removeUser(request.uid);
			request.res.end("connection closed");
			return;
		} else if (chunk == 'keepalive') {
			console.log('received keepalive for uid ' + request.uid);
			engine.keepAliveUser(request.uid);
		} else {
			var data = querystring.parse(chunk);
			if (data.uid) {
				console.log('identified user: ' + data.uid);
				request.uid = data.uid;
			}
			if (data.lat && data.lon) {
				console.log('received update for uid ' + request.uid + ': ' + chunk);
				engine.updateUserLocation(request.uid, data);
			}
		}
		request.res.write('ACK');
		request.timeout = setTimeout(function(){
			console.info('no data received for 60s');
		}, 60000);
	});
}
