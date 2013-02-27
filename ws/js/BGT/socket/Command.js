Ext.define('BGT.socket.Command', {
	constructor:function(command, data, callback){
		this.command = command;
		this.data = data || {};
		this.callback = callback || Ext.emptyFn;
	},
	setRequestId:function(id){
		this.requestId = id;
	},
	getJSON:function(){
		var data = {
			command:this.command,
			data:this.data
		};
		if (typeof(this.requestId) != 'undefined') data.requestId = this.requestId;
		return JSON.stringify(data);
	},
	updateResult:function(data){
		this.success = data.success || false;
		this.result = data.data || {};
		this.callback(this);
	},
	wasSuccessful:function(){
		return this.success;
	},
	getResult:function(){
		return this.result;
	}
});
