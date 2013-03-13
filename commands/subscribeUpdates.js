module.exports = function(data){
	if (!data.category) return new Error('missing parameters');
	var event = this.getEvent(data);
	return event.subscribe(this, data.category);
};
