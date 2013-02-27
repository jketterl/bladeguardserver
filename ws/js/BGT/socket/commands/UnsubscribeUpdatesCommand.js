Ext.define('BGT.socket.commands.UnsubscribeUpdatesCommand', {
	extend:'BGT.socket.Command',
	constructor:function(event, categories, callback){
		this.callParent(['unsubscribeUpdates', {eventId:event.get('id'), category:categories}, callback]);
	}
});
