Ext.define('BGT.socket.Socket', {
	statics:{
		instance:null,
		getInstance:function(){
			if (this.instance == null) this.instance = new this();
			return this.instance;
		}
	},
	constructor:function(){
		this.queue = [];
	},
	connect:function(){
		var me = this;
		if (!me.socket) {
			me.socket = new WebSocket('wss://' + top.location.host + '/socket');
			me.socket.onopen = function(){
				console.info('socket is now open!');
				me.onConnect();
			};
		};
	},
	sendHandshake:function(){
		this.socket.send(JSON.stringify({handshake:{platform:'bgt-admin',version:'0.0.1',build:1}}));
	},
	sendCommand:function(command){
		if (this.queue) {
			this.connect();
			this.queue.push(command);
			return;
		}
		this.socket.send(JSON.stringify(command));
	},
	onConnect:function(){
		var me = this;
		me.sendHandshake();
		if (me.queue) {
			var queue = me.queue;
			delete(me.queue);
			queue.forEach(function(command){
				me.sendCommand(command);
			});
		}
	}
});
