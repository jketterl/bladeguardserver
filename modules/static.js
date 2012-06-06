var fs = require('fs');
var mime = require('mime-magic');

module.exports.process = function(req){
	var me = this,
	    file = __dirname + '/../ws' + (req.path || '');
	fs.stat(file, function(err, stats){
		if (err) switch (err.code) {
			case 'ENOENT':
				req.res.writeHead(404);
				return req.res.end('file not found');
			default:
				req.res.writeHead(503);
				return req.res.end('filesystem error');
		};
		if (stats.isDirectory()) {
			if (req.path && req.path.match(/\/$/)) {
				req.path = (req.path || '' ) + '/index.html';
				return me.process(req);
			} else {
				req.res.writeHead(301, {Location:'/bgt/static' + (req.path || '') + '/'});
				return req.res.end();
			}
		}
		if (req.req.headers['if-modified-since']) {
			var modified = new Date(req.req.headers['if-modified-since']);
			if (stats.mtime <= modified) {
				req.res.writeHead(304);
				return req.res.end();
			}
		}
		mime.fileWrapper(file, function(err, type){
			if (err) {
				req.res.writeHead(503);
				return req.res.end('internal server error');
			}
			req.res.writeHead(200, {
				'Content-Type':type,
				'Last-Modified':stats.mtime.toGMTString()
			});
			var stream = fs.createReadStream(file); 
			stream.on('error', function(err){
				console.info(err.stack);
				req.res.writeHead(503);
				req.res.end('filesystem error');
			});
			stream.pipe(req.res);
		});
	});
};
