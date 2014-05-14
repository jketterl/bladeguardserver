var util = require('util');

module.exports = function(data){
	var me = this,
        event = me.getEvent(data);
    // early registration is only allowed for android up to build 15; later versions are activated via GCM push message.
	util.log("incoming control request on event " + event.id);
	event.registerConnection(me, !me.handshake || me.handshake.platform != "android" || me.handshake.build <= 15);
	this.controlled = true;
};
