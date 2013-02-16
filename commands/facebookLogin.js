var util = require('util');
module.exports = function(data, callback){
	var me = this;
	if (typeof(data.accessToken) == 'undefined') return callback(new Error('access token must be set'));
	BGTFacebookUser.login(data.accessToken, function(user){
		util.log('Facebook user login: ' + user);
		me.setUser(user);
		callback(user);
	});
};
