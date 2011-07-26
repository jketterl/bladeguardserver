var util = require('util');
var querystring = require('querystring');

this.process = function(request) {
	request.req.on('data', function(chunk) {
		chunk = chunk.toString();
		var data = querystring.parse(chunk);
		request.res.writeHead(200);
		request.res.end("OK");
	});
}
