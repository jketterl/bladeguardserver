Ext.define('BGT.events.Event', {
	extend:'Ext.data.Model',
	requires:[
		'BGT.socket.Socket',
		'BGT.data.proxy.Socket'
	],
	fields:[
		{name:'id', type:'integer'},
		{name:'title', type:'string'},
		{name:'start', type:'date'},
		{name:'end', type:'date'},
		{name:'map', type:'integer'},
		{name:'mapName', type:'string'},
		{name:'weather', defaultValue:null},
		{name:'actualStart', type:'date'},
		{name:'actualEnd', type:'date'}
	],
	proxy:{
		type:'socket',
		socket:BGT.socket.Socket.getInstance(),
		commands:{
			read:{
				command:'BGT.socket.commands.GetEventsCommand',
				params:{
					all:true
				}
			},
			create:'BGT.socket.commands.CreateEventCommand'
		},
		reader:{
			type:'json'
		}
	},
	receiveUpdate:function(update){
		var me = this;
		for (category in update) {
			update[category].forEach(function(up){
				if (up.eventId != me.get('id')) return;
				me.fireEvent(category, up);
			});
		}
	},
	reRegisterUpdates:function(){
		var me = this,
		    events = [];
		for (var a in me.events) events.push(a);
		if (!events.length) return;
		var command = Ext.create('BGT.socket.commands.SubscribeUpdatesCommand', me, events, function(command){});
		BGT.socket.Socket.getInstance().sendCommand(command);
	},
	reset:function(){
		this.fireEvent('reset', this);
	},
	on:function(ev){
		var me = this;
		if (!me.hasListener(ev)) {
			var socket = BGT.socket.Socket.getInstance();
			if (!me.bound) {
				socket.on('update', Ext.bind(me.receiveUpdate, me));
				socket.on('open', Ext.bind(me.reRegisterUpdates, me));
				socket.on('close', Ext.bind(me.reset, me));
				me.bound = true;
			}
			var command = Ext.create('BGT.socket.commands.SubscribeUpdatesCommand', me, [ev], function(command){});
			socket.sendCommand(command);
		}
		return me.callParent(arguments);
	},
	un:function(ev){
		var me = this;
		me.callParent(arguments);
		if (!me.hasListener(ev)) {
			var socket = BGT.socket.Socket.getInstance();
			var command = Ext.create('BGT.socket.commands.UnsubscribeUpdatesCommand', me, [ev], function(command){});
			socket.sendCommand(command);
		}
	}
});


