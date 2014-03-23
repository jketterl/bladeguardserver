var http = require('http');
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
var engine = require('ejs-locals');
var BGTController = require('./controller');

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
            app.engine('ejs', engine);
            app.locals.dateformat = require('dateformat');
            app.set('view engine', 'ejs');
            var controller = new BGTController(app);


            var httpServer = http.createServer(app).listen(3000)

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
