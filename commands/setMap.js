module.exports = function(data, callback){
	if (!this.getUser().isAdmin()) return callback(new Error('only admin users can switch the map'));
	if (typeof(data.id) == 'undefined') return callback(new Error("Missing map id!"));
	this.getEvent(data).setMap(data.id, callback);
};
