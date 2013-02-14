Ext.define('BGT.socket.commands.FacebookLoginCommand', {
	extend:'BGT.socket.Command',
	constructor:function(fbId, callback){
		this.callParent(['facebookLogin', {userId:fbId}, callback]);
	}
});
