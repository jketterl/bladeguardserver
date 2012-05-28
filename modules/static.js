var fs = require('fs');

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
		var stream = fs.createReadStream(file); 
		stream.on('error', function(err){
			console.info(err.stack);
			req.res.writeHead(503);
			req.res.end('filesystem error');
		});
		stream.pipe(req.res);
	});
};
