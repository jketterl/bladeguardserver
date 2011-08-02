this.process = function(request) {
	if (!request.session || !request.session.getData().user) {
		request.res.writeHead(403);
		request.res.end('You must be logged in');
		return;
	}
	var message = '';
	if (request.mid) {
		engine.setMap(BGTMap.getMap(request.mid));
		message = 'Map changed!<br>';
	}
	request.res.setHeader('Content-Type', 'text/html');
	request.res.writeHead(200);
	var output = '<html><head><title>Map selection</title></head><body>';
	output += message;
	for (var i in BGTMap.maps) {
		output += '<a href="/bgt/setmap?mid=' + i + '">' + BGTMap.maps[i] + '</a><br>';
	}
	output += '</body></html>';
	request.res.end(output);
}
