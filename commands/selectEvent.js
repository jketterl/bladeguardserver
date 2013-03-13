module.exports = function(data){
	if (!data.eventId) return new Error('missing event id');
	this._event = BGTEvent.get(data.eventId);
};
