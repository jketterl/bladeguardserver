var fs = require('fs');

module.exports.process = function(req){
	var me = this,
	    file = __dirname + '/../ws' + req.path;
	fs.stat(file, function(err, stats){
		if (err) switch (err.code) {
			case 'ENOENT':
				return req.res.end('file not found');
			default:
				return req.res.end('filesystem error');
		};
		if (stats.isDirectory()) {
			req.path += '/index.html';
			return me.process(req);
		}
		var stream = fs.createReadStream(file); 
		stream.on('error', function(err){
			console.info(err.stack);
			req.res.end('filesystem error');
		});
		stream.pipe(req.res);
	});
};
