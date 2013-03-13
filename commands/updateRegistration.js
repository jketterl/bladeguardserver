module.exports = function(data, callback){
	var me = this;
	var platform = 'android';
	if (me.handshake && me.handshake.platform) platform = me.handshake.platform;
	db.query().select('id').from('registration').where('platform = ? and registration_id = ?', [platform, data.regId]).execute(function(err, result){
		if (err) return callback(err);
		var user = me.getUser();
		var userId = user.anonymous ? null : user.uid;
		if (result.length) {
			db.query().update('registration').set({user_id:userId}).where('platform = ? and registration_id = ?', [platform, data.regId]).execute(function(err, result){
				callback(err ? err : true);
			});
		} else {
			db.query().insert('registration', ['registration_id', 'user_id', 'platform'], [data.regId, userId, platform]).execute(function(err, result){
				callback(err ? err : true);
			});
		}
	});
};
