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
db = new (require('db-mysql').Database)(require('./config/db.json'));
BGT = {};
require('./gcm');
require('./apns');
BGT.messenger = {
	messengers:[
		new BGT.GCM.Service(require('./config/gcm.json')),
		new BGT.APNS.Service(require('./config/apns.json'))
	],
	sendBroadcastMessage:function(){
		var a = arguments;
		this.messengers.forEach(function(messenger){
			messenger.sendBroadcastMessage.apply(messenger, a);
		});
	}
};
require('./facebook');
var express = require('express');


db.connect(function(err){
	if (err) {
		util.log('could not connect to database; exiting.');
		return;
	}

	BGTEvent.loadAll(function(events){
		if (util.isError(events)) {
			util.log('could not load event data from database; exiting.');
			return;
		}

		var startServer = function(options){
			var app = express();
			app.set('view engine', 'ejs');
			app.get('/', function(req, res){
				res.render('index');
			});
			app.use('/static', express.static(__dirname + '/ws'));
			app.get('/event.html', function(req, res){
				res.render('event/list', {events:BGTEvent.getAll()});
			});
			app.get('/event/:id.html', function(req, res){
				res.render('event/event', {
					event:BGTEvent.get(req.params.id),
					url:'https://' + req.headers.host + '/event/' + req.params.id + '.html'
				});
			});
			app.get('/admin', function(req, res){
				res.render('admin/index');
			});

			var httpServer = https.createServer(options, app).listen(443)

			var wsServer = new WebSocketServer({
				httpServer:httpServer,
				maxReceivedFrameSize:1024*1024
			});

			wsServer.on('request', function(request){
				var connection = new BGTSocketConnection(request.accept());
			});
		};

		var options = require('./config/keys.json');
		var callbacks = 0;
		for (var a in options) {
			callbacks ++;
			(function(a){
				fs.readFile(options[a], function(err, data){
					if (err) throw err;
					callbacks--;
					options[a] = data.toString();
					if (callbacks == 0) startServer(options);
				});
			})(a);
		}

	});
});
