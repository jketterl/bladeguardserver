var util = require('util');

module.exports = function(data, callback){
	var me = this;
	if (!data.user || !data.pass) {
		util.log('login attempt with missing credentials - denied');
		return process.nextTick(function(){
			callback(new Error("missing credentials"));
		});
	}
	BGTUser.login(data.user, data.pass, function(err, user){
		if (err) {
			util.log(err);
			return callback(err);
		}
		util.log('user login: ' + user);
		me.setUser(user);
		callback(user.toJSON());
	});
};
