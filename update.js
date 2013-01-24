var util = require('util');

BGTUpdate = function(category, data) {
	this.category = category;
	this.data = data;
}

BGTUpdate.prototype.toJSON = function() {
	this.data.eventId = this.event.id;
	return this.data;
}

BGTUpdate.prototype.toString = function() {
	return JSON.stringify(this);
}

BGTUpdate.prototype.isApplicable = function(conn) {
	return true;
}

BGTUpdate.prototype.getCategory = function() {
	return this.category;
}

BGTUpdate.prototype.setEvent = function(event) {
	this.event = event;
}



BGTLocationUpdate = function(user) {
	this.user = user;
	this.category = 'movements';
}

util.inherits(BGTLocationUpdate, BGTUpdate);

BGTLocationUpdate.prototype.isApplicable = function(conn) {
	if (!this.user.location) return false;
	if (conn.getUser()) {
		if (conn.getUser() == this.user) return false;
	}
	return true;
}

BGTLocationUpdate.prototype.toJSON = function() {
	return {
		user:{
			id:this.user.uid,
			name:this.user.getName(),
			team:this.user.getTeam()
		},
		location:{
			lat:this.user.location.lat,
			lon:this.user.location.lon
		},
		eventId:this.event.id
	}
}

BGTStatsUpdate = function(stats) {
	this.stats = stats;
	this.category = 'stats';
}

util.inherits(BGTStatsUpdate, BGTUpdate);

BGTStatsUpdate.prototype.toJSON = function() {
	this.stats.eventId = this.event.id;
	return this.stats;
}
