Ext.define('BGT.data.proxy.Socket', {
	extend:'Ext.data.proxy.Proxy',
	alias:'proxy.socket',
	read:function(operation, callback, scope){
		var me = this,
		    command = Ext.create(me.commands.read, function(command){
			operation.setCompleted();
			if (command.wasSuccessful()){
				operation.resultSet = me.getReader().read(command.getResult());
				operation.setSuccessful();
			}
			Ext.callback(callback, scope || me, [operation]);
		});
		me.socket.sendCommand(command);
	}
});

Ext.define('BGT.admin.events.Event', {
	extend:'Ext.data.Model',
	requires:[
		'BGT.socket.Socket'
	],
	fields:[
		{name:'id', type:'integer'},
		{name:'title', type:'string'}
	],
	proxy:{
		type:'socket',
		socket:BGT.socket.Socket.getInstance(),
		commands:{
			read:'BGT.socket.commands.GetEventsCommand'
		},
		reader:{
			type:'json'
		}
	}
});

Ext.define('BGT.admin.events.Grid', {
	extend:'Ext.grid.Panel',
	columns:[
		{header:'ID', dataIndex:'id', hidden:true},
		{header:'Name', dataIndex:'title', flex:1}
	],
	store:{
		model:'BGT.admin.events.Event',
		autoLoad:true
	},
	title:'Blade Night Liste'
});
