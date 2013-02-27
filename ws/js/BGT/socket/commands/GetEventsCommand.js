Ext.define('BGT.socket.commands.GetEventsCommand', {
	extend:'BGT.socket.Command',
	constructor:function(callback){
		this.callParent(['getEvents', {}, callback]);
	}
});
