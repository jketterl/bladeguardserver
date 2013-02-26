module.exports = function(req, callback){
	if (!this.getUser().isAdmin()) return new Error('only admin users are allowed to create events');
	var event = new BGTEvent(req);
	BGTEvent.addEvent(event, callback);
};
