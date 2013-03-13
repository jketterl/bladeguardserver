var util = require('util');

module.exports = function(data, callback){
	var location = new BGTLocation(data);
	this.getUser().updateLocation(location);
	var engine = this.getEvent(data).getEngine();
	engine.updateUserLocation(this.getUser(), location, function(position){
		var result = {
			locked:false
		}
		if (position) {
			return engine.getMap(function(map){
				var stats = engine.stats.getLatestStats();
				if (stats.between) try {
					result.distanceToEnd = map.getDistanceBetween(stats.between[0], position.index);
					result.distanceToFront = map.getDistanceBetween(position.index, stats.between[1]);
				} catch (e) {
					util.log('Error calculating user distances:\n' + e.stack);
				}
				result.locked = true;
				result.index = position.index;
				callback(result);
			});
		}
		callback(result);
	});
};
