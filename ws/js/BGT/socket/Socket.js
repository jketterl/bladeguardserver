Ext.define('BGT.socket.Socket', {
	extend:'Ext.util.Observable',
	statics:{
		instance:null,
		getInstance:function(){
			if (this.instance == null) this.instance = new this();
			return this.instance;
		}
	},
	constructor:function(){
		this.queue = [];
		this.requestCount = 0;
		this.requests = [];
		this.addEvents('connect', 'update');
		this.callParent(arguments);
	},
	connect:function(){
		var me = this;
		if (!me.socket) {
			me.socket = new WebSocket('wss://' + top.location.host + '/socket');
			me.socket.onopen = function(){
				console.info('socket is now open!');
				me.onConnect();
				me.socket.onmessage = function(event){
					if (event.type != 'message') return;
					var data = JSON.parse(event.data);
					if (typeof(data.requestId) != 'undefined' && me.requests[data.requestId]) {
						var command = me.requests[data.requestId];
						command.updateResult(data);
					} else if (data.event && data.event == 'update') {
						me.fireEvent('update', data.data);
					}
				};
				me.socket.onclose = function(){
					console.info('socket closed');
					console.info(arguments);
				};
				me.socket.onerror = function(){
					console.info(arguments);
				}

				me.fireEvent('connect', me);
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
		this.requests[this.requestCount] = command;
		command.setRequestId(this.requestCount++);
		this.socket.send(command.getJSON());
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
