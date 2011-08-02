var util = require('util');
var querystring = require('querystring');

this.process = function(request) {
	var data = ''
	if (request.req.method == 'POST') request.req.on('data', function(chunk) {
		data += chunk.toString();
	});
	request.req.on('end', function() {
		var output = '<html><head><title>Login</title><body>';
		if (request.req.method == 'POST') {
			data = querystring.parse(data);
			if (data.user && data.pass) {
				BGTUser.login(data.user, data.pass, function(err, user){
					if (err) {
						util.log(err);
						request.res.writeHead(403);
						request.res.end('login failed!');
					} else {
						util.log('user login: ' + user);
						request.res.writeHead(200);
						request.res.end('login successful');
					}
				});
				return;
			}
			request.res.writeHead(403);
			request.res.end('login failed!');
		} else {
			output += '<form method="post">';
			output += '<label for="user">User:</label><input type="text" name="user" /><br />';
			output += '<label for="pass">Password:</label><input type="password" name="pass" /><br />';
			output += '<input type="submit" value="Login" />';
			output += '</form>';
		}
		output += '</body></html>';
		request.res.writeHead(200);
		request.res.end(output);
	});
}
