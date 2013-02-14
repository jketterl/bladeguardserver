Ext.define('BGT.admin.map.Map', {
	extend:'Ext.data.Model',
	requires:[
		'BGT.data.proxy.Socket',
		'BGT.socket.Socket'
	],
	fields:[
		{name:'id', type:'integer'},
		{name:'name', type:'string'}
	],
	proxy:{
		type:'socket',
		socket:BGT.socket.Socket.getInstance(),
		reader:'json',
		commands:{
			read:'BGT.socket.commands.GetMapsCommand'
		}
	}
});

Ext.define('BGT.admin.map.Grid', {
	extend:'Ext.grid.Panel',
	title:'Strecken',
	closable:true,
	columns:[
		{header:'ID', dataIndex:'id', hidden:true},
		{header:'Name', dataIndex:'name', flex:1}
	],
	store:{
		model:'BGT.admin.map.Map',
		autoLoad:true
	}
});
