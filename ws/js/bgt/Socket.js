Ext.define('BGT.Socket', {
	extend:'Ext.util.Observable',
	connect:function(){
		var me = this;
		me.socket = new WebSocket('wss://' + location.hostname + '/bgt/socket');
		me.socket.onopen = function(){
			me.send({handshake:{platform:'browser',version:'0.0.1'}});
			me.fireEvent('connect');
		};
		me.socket.onmessage = function(message){
			try {
				var data = Ext.JSON.decode(message.data);
				me.fireEvent('message', data);
			} catch (e) {};
		};
		me.socket.onclose = function(){
			setTimeout(me.connect, 5000);
		};
		me.socket.onerror = function(){
			socket.close();
			me.connect();
		};
	},
	send:function(data){
		var me = this;
		me.socket.send(Ext.JSON.encode(data));;
	},
	subscribe:function(category){
		var me = this;
		me.send({
			command:'subscribeUpdates',
			data:{category:category}
		});
	},
	unsubscribe:function(category){
		var me = this;
		me.send({
			command:'unSubscribeUpdates',
			data:{category:category}
		});
	}
});
