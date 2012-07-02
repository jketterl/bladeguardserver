var https = require('https');
var fs = require('fs');
require('./engine');
require('./router');
var router = new BGTRouter();
require('./location');
var util = require('util');
require('./session');
var WebSocketServer = require('websocket').server;
require('./socketconnection');
require('./event.js');
db = require('./db');
BGT = {};
require('./gcm');
BGT.messenger = new BGT.GCM.Service(require('./config/gcm.json'));

db.connect(function(err){
	if (err) {
		util.log('could not connect to database; exiting.');
		return;
	}

	engine = new BGTEngine();
	BGTEvent.loadAll(function(err){
		if (err) {
			util.log('could not load event data from database; exiting.');
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
});
