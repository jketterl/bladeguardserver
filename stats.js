var util = require('util');

BGTStatsEngine = function(engine) {
	this.engine = engine;
	this.stats = {};
	var me = this;
	setInterval(function(){
		me.engine.getMap(function(map){
			try {
				me.updateStats(map);
			} catch (e) {
				util.log(e.stack);
				me.setStats({});
			}
		});
	}, 10000);
}

var EventEmitter = require('events').EventEmitter;
BGTStatsEngine.prototype = new EventEmitter;

BGTStatsEngine.prototype.updateStats = function(map) {
	var stats = {
		users:0,
		tracked:0,
		speeded:0
	}
	var positions = [];
	var speedSum = 0;
	for (var i in this.engine.users) {
		var user = this.engine.users[i];
		// the "stats" flag indicates, whether or not the user is to be considered for stats calculation
		if (!user.stats) {
			console.info('skipping user ' + user);
			continue;
		}
		stats.users++;
		var position = this.engine.tracker.getPosition(user);
		if (position) {
			stats.tracked++;
			positions.push(position.index);
			if (user.location && user.location.speed) {
				stats.speeded++;
				speedSum += parseFloat(user.location.speed);
			}
		}
	}
	positions.sort(function(a,b){return a-b;});
	if (positions.length > 1) {
		var longest = false;
		for (var i = 0; i < positions.length; i++) {
			var nextIndex = i + 1;
			if (nextIndex >= positions.length) nextIndex = 0;
			try {
				var distance = map.getDistanceBetween(positions[i], positions[nextIndex]);
				if (!longest || longest.distance < distance) {
					longest = {
						distance:distance,
						i1:positions[i],
						i2:positions[nextIndex]
					};
				}
			} catch (e) {
				// it's possible that a user has an outdated position (obtained from the oild map) after a map switch. this could lead to an exception here.
				// we ignore that case for now. after the next update coming from the user (or his/her removal on timeout) everything will be fine.
				//util.log(e.stack);
			}
		}
		if (longest) {
			stats.between = [
				longest.i2,
				longest.i1	
			];
			stats.bladeNightLength = map.getDistanceBetween(longest.i2, longest.i1);
		}
	}
	if (stats.speeded > 0) stats.bladeNightSpeed = speedSum / stats.speeded;
	this.setStats(stats);
}

BGTStatsEngine.prototype.setStats = function(stats) {
	this.stats = stats;
	this.emit('stats', new BGTStatsUpdate(stats));
}

BGTStatsEngine.prototype.getLatestStats = function() {
	return this.stats;
}
