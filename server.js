var https = require('https');
var fs = require('fs');
require('./engine');
engine = new BGTEngine();
require('./router');
var router = new BGTRouter();
require('./location');
var util = require('util');
require('./session');
var WebSocketServer = require('websocket').server;
require('./socketconnection');

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
		key: fs.readFileSync('/home/ec2-user/keys/server.key'),
		cert: fs.readFileSync('/home/ec2-user/keys/server.crt')
	};

	var httpServer = https.createServer(options, function (req, res) {
  		util.log('connect: ' + req.connection.socket.remoteAddress + ' requests ' + req.url + ' (' + req.headers['user-agent'] + ')');
		var request = router.parse(req.url);
		request.req = req; request.res = res;
		// automatic session reconnect (!)
		BGTSession.processRequest(request);
		var module = engine.loadModule(request);
		module.process(request);
	}).listen(443);

	var wsServer = new WebSocketServer({
		httpServer:httpServer
	});

	wsServer.on('request', function(request){
		var connection = new BGTSocketConnection(request.accept());
		engine.addMapConnection(connection);
	});
});
