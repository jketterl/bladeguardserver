var http = require('http');
var fs = require('fs');
require('./engine');
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
var engine = require('ejs-locals');
var BGTController = require('./controller');

var IconSet = require('./weather/iconset'),
    path = require('path'),
    set = new IconSet(path.resolve('.') + '/weather/icons/Realll_Day');

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

        var app = express();
        app.use(express.logger({
            stream:fs.createWriteStream('/var/log/bgt/access.log')
        }));
        app.engine('ejs', engine);
        app.locals.moment = require('moment');
        app.set('view engine', 'ejs');
        var controller = new BGTController(app);
        set.registerWith(app);

        var httpServer = http.createServer(app).listen(3000)

        var wsServer = new WebSocketServer({
            httpServer:httpServer,
            maxReceivedFrameSize:1024*1024
        });

        wsServer.on('request', function(request){
            var connection = new BGTSocketConnection(request.accept());
        });

    });
});
