Ext.define('BGT.admin.events.Event', {
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
	closable:true,
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
