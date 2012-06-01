var util = require('util');

BGTUpdate = function(category, data) {
	this.category = category;
	this.data = data;
}

BGTUpdate.prototype.getData = function() {
	return this.data;
}

BGTUpdate.prototype.toJSON = function() {
	return JSON.stringify(this.getData());
}

BGTUpdate.prototype.toString = function() {
	return this.toJSON();
}

BGTUpdate.prototype.isApplicable = function(conn) {
	return true;
}

BGTUpdate.prototype.getCategory = function() {
	return this.category;
}



BGTLocationUpdate = function(user) {
	this.user = user;
	this.category = 'movements';
}

BGTLocationUpdate.prototype = new BGTUpdate;

BGTLocationUpdate.prototype.isApplicable = function(conn) {
	if (!this.user.location) return false;
	if (conn.request.session.getData().user) {
		if (conn.request.session.getData().user == this.user) return false;
	}
	return true;
}

BGTLocationUpdate.prototype.getData = function() {
	return {
		user:{
			id:this.user.uid,
			name:this.user.getName(),
			team:this.user.getTeam()
		},
		location:{
			lat:this.user.location.lat,
			long:this.user.location.lon
		}
	}
}

BGTStatsUpdate = function(stats) {
	this.stats = stats;
	this.category = 'stats';
}

util.inherits(BGTStatsUpdate, BGTUpdate);

BGTStatsUpdate.prototype.getData = function() {
	return this.stats;
}
