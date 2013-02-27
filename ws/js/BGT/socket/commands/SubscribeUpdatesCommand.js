Ext.define('BGT.socket.commands.SubscribeUpdatesCommand', {
	extend:'BGT.socket.Command',
	constructor:function(event, categories, callback){
		this.callParent(['subscribeUpdates', {eventId:event.get('id'), category:categories}, callback]);
	}
});
