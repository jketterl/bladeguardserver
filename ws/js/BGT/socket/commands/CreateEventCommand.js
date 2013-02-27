Ext.define('BGT.socket.commands.CreateEventCommand', {
	extend:'BGT.socket.Command',
	constructor:function(event, callback){
		this.callParent(['createEvent', event.getData(), callback]);
	}
});
