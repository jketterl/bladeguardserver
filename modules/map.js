var fs = require('fs');

this.process = function(request){
	engine.getMap().getMapXML(function(err, xml) {
		if (err) {
			request.res.writeHead(503);
			request.res.end('map failed');
			return;
		}
		request.res.writeHead(200);
		request.res.write('<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n' + xml);
		request.res.end();
	});
}
