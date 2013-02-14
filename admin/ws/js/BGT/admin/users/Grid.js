Ext.define('BGT.admin.users.User', {
	extend:'Ext.data.Model',
	requires:[
		'BGT.socket.Socket',
		'BGT.data.proxy.Socket'
	],
	fields:[
		{name:'id', type:'integer'},
		{name:'name', type:'string'},
		{name:'team_name', type:'string'},
		{name:'admin', type:'boolean'}
	],
	proxy:{
		type:'socket',
		socket:BGT.socket.Socket.getInstance(),
		commands:{
			read:'BGT.socket.commands.GetUsersCommand'
		},
		reader:{
			type:'json'
		}
	}
});

Ext.define('BGT.admin.users.Grid', {
	extend:'Ext.grid.Panel',
	title:'Benutzerverwaltung',
	columns:[
		{header:'ID', dataIndex:'id', hidden:true},
		{header:'Name', dataIndex:'name', flex:2},
		{header:'Team', dataIndex:'team_name', flex:1},
		{header:'Admin', dataIndex:'admin', xtype:'booleancolumn', trueText:'Ja', falseText:'Nein'}
	],
	store:{
		model:'BGT.admin.users.User',
		autoLoad:true
	}
});
