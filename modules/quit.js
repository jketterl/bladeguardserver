this.process = function(request) {
	if (request.uid) {
		engine.removeUser(request.uid);
		request.res.writeHead(200);
		request.res.end('quit ok');
		return;
	}
	request.res.writeHead(503);
	request.res.end('quit not ok');
}
