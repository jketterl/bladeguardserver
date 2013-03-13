module.exports = function(data, callback){
	if (!this.getUser().isAdmin()) return callback(new Error('only admin users are allowed to start events'));
	BGTUser.getAll(function(err, users){
		callback(err ? err : users);
	});
};
