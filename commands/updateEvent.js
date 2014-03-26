module.exports = function(data, callback){
	if (!this.getUser().isAdmin()) return callback(new Error('only admin users are allowed to edit events'));
	this.getEvent(data).update(data, callback);
};
