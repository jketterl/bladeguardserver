Ext.define('BGT.socket.commands.GetTeamsCommand', {
	extend:'BGT.socket.Command',
	constructor:function(callback){
		this.callParent(['getTeams', {}, callback]);
	}
});
