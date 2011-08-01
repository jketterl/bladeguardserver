var util = require('util');

BGTStatsEngine = function(engine) {
	this.engine = engine;
	var me = this;
	setInterval(function(){
		try {
			me.updateStats();
		} catch (e) {
			util.log(e);
		}
	}, 10000);
}

BGTStatsEngine.prototype.updateStats = function() {
	var stats = {
		users:0,
		tracked:0
	}
	var positions = [];
	for (var i in this.engine.users) {
		var user = this.engine.users[i];
		stats.users++;
		if (user.hasPosition()) {
			stats.tracked++;
			positions.push(user.position.index);
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
	util.log(util.inspect(stats));
	this.engine.sendUpdates({
		stats:'<bladenightlength>' + stats.bladeNightLength + '</bladenightlength>'
	});
}
