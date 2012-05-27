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
		for (var i = 0; i < me.loadCallbacks.length; i++) {
			me.loadCallbacks[i]();
		}
	});
	fs.readFile('/home/ec2-user/maps/' + BGTMap.maps[id] + '.gpx', function(err, data) {
		if (err) {
			util.log(err);
			// TODO: call loadCallbacks with an err parameter
			return;
		}
		parser.parseString(data);
	});
};

BGTMap.loadedMaps = [];

BGTMap.getMap = function(mapId) {
	if (BGTMap.loadedMaps[mapId]) return BGTMap.loadedMaps[mapId];
	return BGTMap.loadedMaps[mapId] = new BGTMap(mapId);
}

BGTMap.maps = [
	'Strecke Ost lang',
	'Strecke Ost kurz',
	'Strecke West lang',
	'Strecke West kurz',
	'Strecke Nord lang',
	'Strecke Nord kurz',
	'Strecke Familie',
	'Strecke Familienbladenight Unterhaching'
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
	var index = i1;
	var distance = 0;
	while (index != i2) {
		distance += this.points[index].distanceToPrevious;
		index++;
		if (index >= this.points.length) index = 0;
	}
	return distance;
}
