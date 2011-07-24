/** Converts numeric degrees to radians */
toRad = function(n) {
	return n * Math.PI / 180;
}

BGTLocation = function(data) {
	for (var a in data) this[a] = data[a];
}

BGTLocation.prototype.getDistanceTo = function(location) {
	var lat1 = this.lat;
	var lon1 = this.lon;
	var lat2 = location.lat;
	var lon2 = location.lon;

	// http://www.movable-type.co.uk/scripts/latlong.html
	var R = 6371; // km
	var dLat = toRad(lat2-lat1);
	var dLon = toRad(lon2-lon1);
	var lat1 = toRad(lat1);
	var lat2 = toRad(lat2);

	var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
		Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	return R * c;
}
