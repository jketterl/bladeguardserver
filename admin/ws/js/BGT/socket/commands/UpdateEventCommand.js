Ext.define('BGT.socket.commands.UpdateEventCommand', {
	extend:'BGT.socket.Command',
	constructor:function(event, weather, callback){
		this.callParent(['updateEvent', {eventId:event.get('id'), weather:weather}, callback]);
	}
});
