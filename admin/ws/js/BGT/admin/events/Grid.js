Ext.define('BGT.data.proxy.Socket', {
	extend:'Ext.data.proxy.Proxy',
	alias:'proxy.socket',
	read:function(operation, callback, scope){
		var me = this,
		    command = Ext.create(me.commands.read, function(command){
			operation.setCompleted();
			if (command.wasSuccessful()){
				console.info(command.getResult());
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
		{name:'title', type:'string'},
		{name:'start', type:'date'},
		{name:'end', type:'date'},
		{name:'map', type:'integer'},
		{name:'mapName', type:'string'},
		{name:'weather'}
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
		{header:'Name', dataIndex:'title', flex:1},
		{header:'Strecke', dataIndex:'mapName', flex:1},
		{header:'Start', dataIndex:'start', xtype:'datecolumn', format:'d.m.Y H:i', width:150},
		{header:'Ende', dataIndex:'end', xtype:'datecolumn', format:'d.m.Y H:i', width:150},
		{header:'Wetter', dataIndex:'weather', width:200, renderer:function(v){
			switch(v) {
				case null:
					return 'Noch keine Entscheidung';
				case 1:
					return 'Ja, wir fahren';
				case 0:
					return 'Abgesagt';
				default:
					return v;
			}
		}}
	],
	store:{
		model:'BGT.admin.events.Event',
		autoLoad:true
	},
	title:'Blade Night Liste'
});
