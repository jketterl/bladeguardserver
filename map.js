var fs = require('fs');
var xml2js = require('xml2js');
require('./location');
var util = require('util');

BGTMap = function(id) {
	var parser = new xml2js.Parser();
	this.points = [];
	var p = this.points;
	var me = this;
	this.loadCallbacks = [];
	this.name = BGTMap.maps[id];

	parser.addListener('end', function(result) {
		var previousLocation;
		var length = 0;
		for (var i = 0; i < result.rte.rtept.length; i++) {
			var point = result.rte.rtept[i];
			var location = new BGTLocation({lat:point['@'].lat, lon:point['@'].lon});
			if (previousLocation) {
				var distance = location.getDistanceTo(previousLocation);
				length += distance;
				location.distanceToPrevous = distance;
			}
			p.push(location);
			previousLocation = location;
		}
		util.log('route length is ' + length);
		for (var i = 0; i < me.loadCallbacks.length; i++) {
			me.loadCallbacks[i]();
		}
	});
	fs.readFile('/root/' + BGTMap.maps[id] + '.gpx', function(err, data) {
		if (err) {
			util.log(err);
			// TODO: call loadCallbacks with an err parameter
			return;
		}
		parser.parseString(data);
	});
};

BGTMap.maps = [
	'Strecke Ost lang',
	'Strecke Ost kurz',
	'Strecke West lang',
	'Strecke West kurz',
	'Strecke Nord lang',
	'Strecke Nord kurz',
	'Strecke Familie'
];

BGTMap.prototype.getMapXML = function(callback) {
	if (this.points.length == 0) {
		var me = this;
		this.loadCallbacks.push(function(){
			me.getMapXML(callback);
		});
	}

	
	var xml = '<gpx xmlns="http://www.topografix.com/GPX/1/1" creator="BladeGuardTracker" version="1.1">\n'+
		  '<rte>';

	for (var i = 0; i < this.points.length; i++) {
		xml += '<rtept lat="' + this.points[i].lat + '" lon="' + this.points[i].lon + '" />';
	}

	xml += '</rte></gpx>';
	callback(null, xml);
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
				map:this,
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
