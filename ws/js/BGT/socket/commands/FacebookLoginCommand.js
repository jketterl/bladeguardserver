Ext.define('BGT.socket.commands.FacebookLoginCommand', {
	extend:'BGT.socket.Command',
	constructor:function(accessToken, callback){
		this.callParent(['facebookLogin', {accessToken:accessToken}, callback]);
	}
});
