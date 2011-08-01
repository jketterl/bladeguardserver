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
	for (var i in this.engine.users) {
		var user = this.engine.users[i];
		stats.users++;
		if (user.hasPosition()) stats.tracked++;
	}
	util.log(util.inspect(stats));
}
