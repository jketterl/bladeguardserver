Ext.define('BGT.socket.commands.AuthCommand', {
	extend:'BGT.socket.Command',
	constructor:function(user, pass, callback){
		this.callParent(['auth', {user:user, pass:pass}, callback]);
	}
});
