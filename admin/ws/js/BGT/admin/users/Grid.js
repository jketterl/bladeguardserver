Ext.define('BGT.admin.users.User', {
	extend:'Ext.data.Model',
	requires:[
		'BGT.socket.Socket',
		'BGT.data.proxy.Socket'
	],
	fields:[
		{name:'id', type:'integer'}
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
		{header:'ID', dataIndex:'id'}
	],
	store:{
		model:'BGT.admin.users.User',
		autoLoad:true
	}
});
