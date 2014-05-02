var util = require('util');

module.exports = function(data){
	util.log("incoming control request");
	var me = this;
    // early registration is only allowed for android up to build 15; later versions are activated via GCM push message.
	this.getEvent(data).registerConnection(me, !me.handshake || me.handshake.platform != "android" || me.handshake.build <= 15);
	this.controlled = true;
};
