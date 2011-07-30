var fs = require('fs');
var xml2js = require('xml2js');
require('./location');

BGTMap = function(file) {
	var parser = new xml2js.Parser();
	this.points = [];
	var p = this.points;
	var me = this;

	parser.addListener('end', function(result) {
		for(var i = 0; i < result.rte.rtept.length; i++) {
			var point = result.rte.rtept[i];
			p.push(new BGTLocation({lat:point['@'].lat, lon:point['@'].lon}));
		}
	});
	fs.readFile(file, function(err, data) {
		me.xml = data;
		parser.parseString(data);
	});
};

BGTMap.prototype.getMapXML = function(callback) {
	if (this.xml) {
		callback(null, this.xml);
		return;
	}
	callback(new Error('XML File not loaded'), false);
}

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
