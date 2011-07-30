var fs = require('fs');
var file = '/root/Strecke Ost lang.gpx';
var bufferSize = 4096;

this.process = function(request){
	engine.getMap().getMapXML(function(err, xml) {
		if (err) {
			request.res.writeHead(503);
			request.res.end('map failed');
			return;
		}
		request.res.writeHead(200);
		request.res.write(xml);
		request.res.end();
	});
}
