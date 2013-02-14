Ext.define('BGT.admin.team.Team', {
	extend:'Ext.data.Model',
	requires:[
		'BGT.socket.Socket',
		'BGT.data.proxy.Socket'
	],
	fields:[
		{name:'id', type:'integer'},
		{name:'name', type:'string'}
	],
	proxy:{
		type:'socket',
		socket:BGT.socket.Socket.getInstance(),
		commands:{
			read:'BGT.socket.commands.GetTeamsCommand'
		},
		reader:{
			type:'json'
		}
	}
});

Ext.define('BGT.admin.team.Grid', {
	extend:'Ext.grid.Panel',
	title:'Teams',
	closable:true,
	columns:[
		{'header':'ID', dataIndex:'id', hidden:true},
		{'header':'Name', dataIndex:'name', flex:1}
	],
	store:{
		model:'BGT.admin.team.Team',
		autoLoad:true
	}
});
