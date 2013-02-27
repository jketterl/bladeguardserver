Ext.define('BGT.socket.commands.GetUsersCommand', {
	extend:'BGT.socket.Command',
	constructor:function(callback){
		this.callParent(['getUsers', {}, callback]);
	}
});
