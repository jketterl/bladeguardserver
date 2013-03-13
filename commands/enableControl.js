var util = require('util');

module.exports = function(data){
	util.log("incoming control request");
	var me = this;
	this.getEvent(data).registerConnection(me);
	this.controlled = true;
};
