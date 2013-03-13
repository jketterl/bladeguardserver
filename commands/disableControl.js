var util = require('util');

module.exports = function(data){
	this.getEvent(data).unregisterConnection(this);
	util.log("control session ended");
	this.controlled = false;
};
