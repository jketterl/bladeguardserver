var fs = require('fs');
var xml2js = require('xml2js');
require('./location');

BGTMap = function(file) {
	var parser = new xml2js.Parser();
	this.points = [];
	var p = this.points;

	parser.addListener('end', function(result) {
		for(var i = 0; i < result.rte.rtept.length; i++) {
			var point = result.rte.rtept[i];
			p.push(new BGTLocation({lat:point['@'].lat, lon:point['@'].lon}));
		}
	});
	fs.readFile('/root/Strecke Ost lang.gpx', function(err, data) {
    		parser.parseString(data);
	});
};

BGTMap.prototype.getCandidatesForLocation = function(location) {
	var candidates = [];
	for (var i = 0; i < this.points.length; i++) {
		var distance = location.getDistanceTo(this.points[i]);
		if (distance <= 0.05) {
			candidates.push({
				index:i,
				distance:distance,
				location:this.points[i]
			});
		}
	}
	return candidates;
}
