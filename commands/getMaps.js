module.exports = function(data, callback){
	if (!this.getUser().isAdmin()) return new Error('only admin users are allowed to list maps.');
	BGTMap.getMaps(callback);
};
