Ext.define('BGT.socket.commands.UpdateEventCommand', {
	extend:'BGT.socket.Command',
	constructor:function(event, callback){
		this.callParent(['updateEvent', event.getData(), callback]);
	}
});
