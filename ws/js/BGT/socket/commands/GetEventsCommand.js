Ext.define('BGT.socket.commands.GetEventsCommand', {
	extend:'BGT.socket.Command',
	constructor:function(params, callback){
		if (typeof(params) == 'function') {
			callback = params;
			params = {};
		}
		this.callParent(['getEvents', params, callback]);
	}
});
