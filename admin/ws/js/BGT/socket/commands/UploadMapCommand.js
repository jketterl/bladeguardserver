Ext.define('BGT.socket.commands.UploadMapCommand', {
	extend:'BGT.socket.Command',
	constructor:function(map, callback){
		this.callParent(['uploadMap', {map:map}, callback]);
	}
});
