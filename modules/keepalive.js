this.process = function(request) {
	if (request.uid) {
		engine.keepAliveUser(engine.getUser(request.uid));
		request.res.writeHead(200);
		request.res.end('keepalive ok');
		return;
	}
	request.res.writeHead(503);
	request.res.end('keepalive not ok');
}
