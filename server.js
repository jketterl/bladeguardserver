var https = require('https');
var fs = require('fs');
require('./engine');
engine = new BGTEngine();
require('./router');
var router = new BGTRouter();
require('./connection');
require('./location');
var util = require('util');
db = new (require('db-mysql').Database)({
	hostname:'localhost',
	database:'bladeguardtracker',
	user:'bgt',
	password:'bgtiscool'
});

db.connect(function(err){
	if (err) {
		util.log('could not connect to database; exiting.');
		return;
	}

	var options = {
		key: fs.readFileSync('/usr/local/apache2/conf/server.key'),
		cert: fs.readFileSync('/usr/local/apache2/conf/server.crt')
	};

	https.createServer(options, function (req, res) {
  		util.log('connect: ' + req.connection.socket.remoteAddress + ' requests ' + req.url + ' (' + req.headers['user-agent'] + ')');
		var request = router.parse(req.url);
		request.req = req; request.res = res;
		var module = engine.loadModule(request);
		module.process(request);
	}).listen(8000);
});
