this.process = function(request) {
	if (!request.session.getData().user || !request.session.getData().user.isAdmin()) {
		request.res.writeHead(403);
		request.res.end('You are not authorized to use this page.');
		return;
	}
	/*
	var message = '';
	if (request.mid) {
		engine.setMap(BGTMap.getMap(request.mid));
		message = 'Map changed!<br>';
	}
	*/
	request.res.setHeader('Content-Type', 'text/xml');
	request.res.writeHead(200);
	var output = '<?xml version="1.0" encoding="UTF-8" ?>\n<maps>';
	for (var i in BGTMap.maps) {
		output += '<map id="' + i + '">' + BGTMap.maps[i] + '</map>';
	}
	output += '</maps>';
	request.res.end(output);
}
