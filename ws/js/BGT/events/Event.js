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
		{name:'weather', defaultValue:null}
	],
	proxy:{
		type:'socket',
		socket:BGT.socket.Socket.getInstance(),
		commands:{
			read:'BGT.socket.commands.GetEventsCommand',
			create:'BGT.socket.commands.CreateEventCommand'
		},
		reader:{
			type:'json'
		}
	}
});


