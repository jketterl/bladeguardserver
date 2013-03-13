Ext.define('BGT.admin.users.User', {
	extend:'Ext.data.Model',
	requires:[
		'BGT.socket.Socket',
		'BGT.data.proxy.Socket'
	],
	fields:[
		{name:'id', type:'integer'},
		{name:'name', type:'string'},
		{name:'pass', type:'string'},
		{name:'team', type:'integer'},
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
