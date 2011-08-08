BGTUpdate = function(category, data) {
	this.category = category;
	this.data = data;
}

BGTUpdate.prototype.getXML = function() {
	return this.data;
}

BGTUpdate.prototype.toString = function() {
	return this.getXML();
}

BGTUpdate.prototype.isApplicable = function(conn) {
	return true;
}

BGTUpdate.prototype.getCategory = function() {
	return this.category;
}



BGTLocationUpdate = function(user) {
	this.user = user;
}

BGTLocationUpdate.prototype = new BGTUpdate;

BGTLocationUpdate.prototype.isApplicable = function(conn) {
	if (!this.user.location) return false;
	if (conn.request.session.getData().user) {
		if (conn.request.session.getData().user == this.user) return false;
	}
	return true;
}

BGTLocationUpdate.prototype.getXML = function() {
	var output = '';
	output += '<user id="' + this.user.uid + '" name="' + this.user.getName() + '" team="' + this.user.getTeam() + '">';
	output += '<location><lat>' + this.user.location.lat + '</lat>';
	output += '<lon>' + this.user.location.lon + '</lon></location>';
	output += '</user>';
	return output;
}

BGTLocationUpdate.prototype.getCategory = function() {
	return 'movements';
}
