module.exports = function(data, callback){
	if (!this.getUser().isAdmin()) return callback(new Error('only admin users are allowed to start events'));
	if (typeof(data.eventId) == 'undefined') return callback(new Error('event id missing'));
	this.getEvent(data).update(data, callback);
};
