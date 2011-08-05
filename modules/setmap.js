this.process = function(request) {
	if (!request.session.getData().user || !request.session.getData().user.isAdmin()) {
		request.res.writeHead(403);
		request.res.end('You are not authorized to use this page.');
		return;
	}
	if (!request.id) {
		request.res.writeHead(503);
		request.res.end('Missing map id');
		return;
	}
	engine.setMap(BGTMap.getMap(request.id));
	request.res.writeHead(200);
	request.res.end('map changed');
}
