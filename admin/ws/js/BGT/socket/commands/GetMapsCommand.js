Ext.define('BGT.socket.commands.GetMapsCommand', {
	extend:'BGT.socket.Command',
	constructor:function(callback){
		this.callParent(['getMaps', {}, callback]);
	}
});
