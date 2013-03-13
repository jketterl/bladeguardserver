module.exports = function(data){
	if (!this.getUser().isAdmin()) return new Error('only admin users are allowed to start events');
	if (typeof(data.eventId) == 'undefined') return new Error('event id missing');
	BGTEvent.get(data.eventId).doStart();
};
