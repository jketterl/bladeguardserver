this.process = function(request) {
	var message = '';
	if (request.mid) {
		engine.setMap(new BGTMap(request.mid));
		message = 'Map changed!<br>';
	}
	request.res.writeHead(200);
	var output = '<html><head><title>Map selection</title></head><body>';
	output += message;
	for (var i in BGTMap.maps) {
		output += '<a href="/bgt/setmap?mid=' + i + '">' + BGTMap.maps[i] + '</a><br>';
	}
	output += '</body></html>';
	request.res.end(output);
}
