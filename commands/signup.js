var crypto = require('crypto');

module.exports = function(data, callback){
	if (typeof(data.user) == 'undefined') return callback(new Error('missing username'));
	if (typeof(data.pass) == 'undefined') return callback(new Error('missing password'));
	var hash = crypto.createHash('md5').update(data.pass).digest('hex');
	db.query().insert('users', ['name', 'pass'], [data.user, hash]).execute(function(err, result){
		if (err) {
			if (/^Duplicate entry .* for key/.test(err)) {
				return callback(new Error('Username already registered'));
			}
			return callback(err);
		}
		callback(true);
	});
};
