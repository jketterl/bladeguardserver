var util = require('util');

BGTStatsEngine = function(engine) {
	this.engine = engine;
	this.stats = {};
	var me = this;
	setInterval(function(){
		try {
			me.updateStats();
		} catch (e) {
			me.setStats({});
			util.log(e);
		}
	}, 10000);
}

var EventEmitter = require('events').EventEmitter;
BGTStatsEngine.prototype = new EventEmitter;

BGTStatsEngine.prototype.updateStats = function() {
	var stats = {
		users:0,
		tracked:0,
		speeded:0
	}
	var positions = [];
	var speedSum = 0;
	for (var i in this.engine.users) {
		var user = this.engine.users[i];
		stats.users++;
		if (user.hasPosition()) {
			stats.tracked++;
			positions.push(user.position.index);
		}
		if (user.location && user.location.speed) {
			stats.speeded++;
			speedSum += parseFloat(user.location.speed);
		}
	}
	positions.sort(function(a,b){return a-b;});
	if (positions.length > 1) {
		var longest;
		for (var i = 0; i < positions.length; i++) {
			var nextIndex = i + 1;
			if (nextIndex >= positions.length) nextIndex = 0;
			var distance = this.engine.getMap().getDistanceBetween(positions[i], positions[nextIndex]);
			if (typeof(longest) == 'undefined' || longest.distance < distance) {
				longest = {
					distance:distance,
					i1:positions[i],
					i2:positions[nextIndex]
				};
			}
		}
		stats.between = [
			longest.i2,
			longest.i1	
		];
		stats.bladeNightLength = this.engine.getMap().getDistanceBetween(longest.i2, longest.i1);
	}
	if (stats.speeded > 0) stats.bladeNightSpeed = speedSum / stats.speeded;
	this.setStats(stats);
}

BGTStatsEngine.prototype.setStats = function(stats) {
	this.stats = stats;
	this.emit('stats', stats);
}

BGTStatsEngine.prototype.getLatestStats = function() {
	return this.stats;
}

BGTStatsEngine.prototype.getStatsXML = function() {
	var stats = this.getLatestStats();
	var output = '';
	if (stats.bladeNightLength) output += '<bladenightlength>' + stats.bladeNightLength + '</bladenightlength>';
	if (stats.bladeNightSpeed) output += '<bladenightspeed>' + stats.bladeNightSpeed + '</bladenightspeed>';
	return output;
}
