this.process = function(request) {
	if (request.uid && request.lat && request.lon) {
		request.res.writeHead(200);
		request.res.end('log module successful');
		engine.updateUserLocation(request.uid, {lat:request.lat, lon:request.lon});
		return;
	}
	request.res.writeHead(503);
	request.res.end('log module failed');
}
