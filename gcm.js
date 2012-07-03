var https = require('https'),
	util = require('util');

BGT.GCM = {};
BGT.GCM.Service = function(config){
	this.config = config;
};

BGT.GCM.Service.prototype.sendBroadcastMessage = function(message, callback) {
	var me = this;
	db.query().select('registration_id').from('registration').execute(function(err, result){
		if (err) return util.log('Error querying registrations from the DB\n' + err.stack);
		var ids = [];
		result.forEach(function(row){
			ids.push(row.registration_id);
		});
		
		var req = {
				method:'POST',
				headers:{
					Authorization:'key=' + me.config.APIkey,
					"Content-Type":'application/json'
				}
			};
		['host', 'path'].forEach(function(key){
			req[key] = me.config[key];
		});
		req = https.request(req, function(res){
			if (res.statusCode != 200) {
				callback(new Error('GCM service returned code ' + res.statusCode));
			} else res.on('end', function(){
				callback(true);
			});
			res.pipe(process.stdout);
		});
		req.on('error', function(err){
			util.log('error sending command to GCM\n' + err.stack);
			callback(err);
		});
		var data = {
			registration_ids:ids,
			data:message
		};
		req.write(JSON.stringify(data));
		req.end();
	});
};
