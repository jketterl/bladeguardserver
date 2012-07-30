var https = require('https'),
	util = require('util');

BGT.GCM = {};
BGT.GCM.Service = function(config){
	this.config = config;
};

BGT.GCM.Service.prototype.sendBroadcastMessage = function(message, callback) {
	var me = this;
	db.query().select('registration_id').from('registration').where('platform = ?', ['android']).execute(function(err, result){
		if (err) {
			util.log('Error querying registrations from the DB\n' + err.stack);
			return callback(new Error('Error querying registrations from the DB'));
		}
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
			} else {
				var data = '';
				res.on('data', function(chunk){
					data += chunk;
				});
				res.on('end', function(){
					try {
						data = JSON.parse(data);
						if (!data.results) return callback(new Error('missing GCM results!'));
						data.results.forEach(function(result, index){
							if (result.error) switch (result.error) {
								case 'NotRegistered':
									db.query().delete().from('registration').where('platform = ? and registration_id = ?', ['android', ids[index]]).execute(function(err, result){
										if (err) util.log('Error deleting registration:\n' + err.stack);
									});
								break;
								default:
									util.log('unknown GCM error: "' + result.error + '" on message with registrationId "' + ids[index] + '"');
							}
						});
						callback(true);
					} catch (e) {
						callback(e);
					}
				});
			}
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
