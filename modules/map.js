var fs = require('fs');
var file = '/root/Strecke Ost lang.gpx';
var bufferSize = 4096;

var readContent = function(fd, res) {
	var buffer = new Buffer(bufferSize);
	fs.read(fd, buffer, 0, bufferSize, null, function(err, bytesRead, buffer) {
		res.write(buffer.toString('utf8', 0, bytesRead));
		if (err || bytesRead < bufferSize) {
			res.end();
			return;
		}
		readContent(fd, res);
	});
}

this.process = function(request){
	fs.open(file, 'r', 0666, function(err, fd){
		if (err) {
			request.res.writeHead(503);
			request.res.end('map failed');
			return;
		}
		request.res.writeHead(200);
		readContent(fd, request.res);
	});
}
