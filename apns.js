var tls = require('tls'),
    fs = require('fs'),
    util = require('util');
var options = require('./config/apns.json');

BGT.APNS = {};
BGT.APNS.Service = function(config){
	var me = this;
	me.config = config;
	me.queue = [];

	var callbacks = 0;
	['key', 'cert'].forEach(function(type){
		callbacks++;
		fs.readFile(config[type], function(err, data){
			if (err) throw err;
			config[type] = data;
			if (--callbacks == 0) me.processQueue();
		});
	});
};

BGT.APNS.Service.prototype = {
	processQueue:function(){
		var me = this,
		    queue = this.queue;
		delete(this.queue);
		queue.forEach(function(message){
			me.sendBroadcastMessage.apply(me, message);
		});
	},
	sendBroadcastMessage:function(message, callback){
		var me = this;
		if (this.queue) return this.queue.append(arguments);
		var apnMessage = {
			aps:{
				'badge':1,
				'sound':'default',
				'alert':{
					'loc-key':message.weather == 1 ? 'yes_rolling' : 'no_cancelled',
					'loc-args':[message.title]
				}
			},
			bgt:message
		};

		function hextobin(hexstr) {
			buf = new Buffer(hexstr.length / 2);
			for(var i = 0; i < hexstr.length/2 ; i++) {
				buf[i] = (parseInt(hexstr[i * 2], 16) << 4) + (parseInt(hexstr[i * 2 + 1], 16));
			}
			return buf;
		}

		db.query().select('registration_id').from('registration').where('platform = ?', ['iOS']).execute(function(err, result){
			if (err) {
				util.log('Error querying registrations from the DB\n' + err.stack);
				return callback(new Error('Error querying registrations from the DB'));
			}
			me.getConnection(function(stream){
				result.forEach(function(row){
					var payload = JSON.stringify(apnMessage);
					var payloadlen = Buffer.byteLength(payload, 'utf-8');
					var tokenlen = 32;
					var buffer = new Buffer(1 +  4 + 4 + 2 + tokenlen + 2 + payloadlen);
					var i = 0;
					buffer[i++] = 1; // command
					var msgid = 0xbeefcace; // message identifier, can be left 0
					buffer[i++] = msgid >> 24 & 0xFF;
					buffer[i++] = msgid >> 16 & 0xFF;
					buffer[i++] = msgid >> 8 & 0xFF;
					buffer[i++] = msgid & 0xFF;

					// expiry in epoch seconds (1 hour)
					var seconds = Math.round(new Date().getTime() / 1000) + 1*60*60;
					buffer[i++] = seconds >> 24 & 0xFF;
					buffer[i++] = seconds >> 16 & 0xFF;
					buffer[i++] = seconds >> 8 & 0xFF;
					buffer[i++] = seconds & 0xFF;

					buffer[i++] = tokenlen >> 8 & 0xFF; // token length
					buffer[i++] = tokenlen & 0xFF;
					var token = hextobin(row.registration_id);
					token.copy(buffer, i, 0, tokenlen)
					i += tokenlen;
					buffer[i++] = payloadlen >> 8 & 0xFF; // payload length
					buffer[i++] = payloadlen & 0xFF;

					var payload = Buffer(payload);
					payload.copy(buffer, i, 0, payloadlen);

					stream.write(buffer);  // write push notification
				});

				if (callback) callback();
			});
		});
	},
	getConnection:function(callback){
		var me = this;
		if (me.stream) process.nextTick(function(){
			callback(me.stream);
		}); else {
			util.log('connecting to APNS TLS stream');
			var stream = tls.connect(options, function(){
				me.stream = stream;
				callback(stream);
				stream.on('data', function(chunk){
					util.log('APNS incoming:');
					util.log(chunk);
				});
				stream.on('end', function(){
					util.log('APNS stream closed.');
					delete(me.stream);
				});
				setTimeout(function(){
					stream.end();
				}, 3600000);
			});
			stream.on('error', function(err){
				util.log('error on apns stream:\n' + err.stack);
			});
		}
	}
};
