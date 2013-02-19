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
