var util = require('util');
var querystring = require('querystring');
var crypto = require('crypto');

this.process = function(request) {
	request.req.on('data', function(chunk) {
		try {
			var data = querystring.parse(chunk.toString());
			var hash = crypto.createHash('md5').update(data.pass).digest('hex');
			db.query().insert('users', ['name', 'pass'], [data.user, hash]).execute(function(err){
				if (err) {
					util.log(err);
					request.res.writeHead(503);
					if (/^Duplicate entry .* for key/.test(err)) {
						request.res.end('Username already registered');
					} else {
						request.res.end('Internal Server Error');
					}
				} else {
					util.log('successfully created user ' + data.user);
					request.res.writeHead(200);
					request.res.end('OK');
				}
			});
		} catch (e) {
			util.log(e);
			request.res.writeHead(503);
			request.res.end('Internal Server Error');
		}
	});
}
