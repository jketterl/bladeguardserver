require('./location');
var util = require('util');

BGTMap = function() {};

util.inherits(BGTMap, require('events').EventEmitter);

BGTMap.loadedMaps = [];

BGTMap.getMap = function(mapId, callback) {
	if (BGTMap.loadedMaps[mapId]) return process.nextTick(function(){
		callback(BGTMap.loadedMaps[mapId]);
	});
	db.query().select('title').from('map').where('id = ?', [mapId]).execute(function(err, result){
		var map = new BGTMap();
		if (err) return callback(new Error(err));
		if (result.length == 0) return callback(new Error('map with id ' + mapId + ' not found'));
		map.name = result[0].title;
		db.query().select('lat, lon').from('points').where('map_id = ?', [mapId]).order('seq').execute(function(err, res){
			if (err) return callback(new Error(err));
			map.setPoints(res);
			BGTMap.loadedMaps[mapId] = map;
			callback(map);
		});
	});
};

BGTMap.getMaps = function(callback) {
	db.query().select('id, title as name').from('map').execute(function(err, result){
		if (err) return callback(err);
		callback(result);
	});
};

BGTMap.prototype.getCandidatesForLocation = function(location) {
	var candidates = [];
	for (var i = 0; i < this.points.length; i++) {
		var distance = location.getDistanceTo(this.points[i]);
		// all points within a 100m range
		if (distance <= 0.1) {
			candidates.push({
				index:i,
				distance:distance,
				location:this.points[i]
			});
		}
	}
	return candidates;
}

BGTMap.prototype.getIndex = function(index) {
	return this.points[index];
}

BGTMap.prototype.getIndexAtOffset = function(index, offset) {
	var dest = index + offset;
	while (dest < this.points.length) dest += this.points.length;
	dest = dest % this.points.length;
	return this.getIndex(dest);
}

BGTMap.prototype.getIndexDelta = function(i1, i2) {
	var delta = i2 - i1;
	var pointCount = this.points.length;
	if (delta * -1 > pointCount / 2) {
		delta += pointCount;
	} else if (delta > pointCount / 2) {
		delta -= pointCount;
	}
	return delta;
}

BGTMap.prototype.getDistanceBetween = function(i1, i2) {
	var len = this.points.length,
	    index = i1,
	    distance = 0;
	if (typeof(i1) != 'number' || typeof(i2) != 'number') throw new Error('only numbers allowed here');
	if (i1 > len || i2 > len) throw new Error('point index too big');
	while (index != i2) {
		distance += this.points[index].distanceToPrevious;
		index++;
		if (index >= len) index = 0;
	}
	return distance;
}

BGTMap.prototype.toJSON = function(){
	return {
		name:this.name,
		points:this.points
	};
}

BGTMap.prototype.toString = function(){
	return JSON.stringify(this.toJSON);
}

BGTMap.prototype.setPoints = function(points){
	var me = this,
	    p = this.points = [];
	var previousLocation;
	var length = 0;
	for (var i = 0; i < points.length; i++) {
		var point = points[i];
		var location = new BGTLocation({lat:point.lat, lon:point.lon});
		if (previousLocation) {
			var distance = location.getDistanceTo(previousLocation);
			length += distance;
			location.distanceToPrevious = distance;
		}
		p.push(location);
		previousLocation = location;
	}
	// add distance for first point (loop course)
	var distance = p[0].getDistanceTo(p[p.length-1]);
	p[0].distanceToPrevious = distance;
	length += distance;

	util.log('route length is ' + length);
};
