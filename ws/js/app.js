Ext.onReady(function(){
	Ext.define('BGT.Event', {
		extend:'Ext.data.Model',
		fields:[
			{name:'timestamp', type:'date'},
			{name:'type', type:'text'},
			{name:'data', type:'object'}
		]
	});

	var store = new Ext.data.Store({
		model:'BGT.Event'
	});

	var dockedItems = [];
	['movements', 'stats', 'quit', 'map'].forEach(function(category){
		dockedItems.push({
			xtype:'checkbox',
			boxLabel:category,
			listeners:{
				change:function(checkbox, checked){
					method = (checked ? '' : 'un') + 'subscribe';
					socket[method](category); 
				}
			}
		});
	});

	Ext.create('Ext.container.Viewport', {
		layout:'border',
		items:[Ext.create('Ext.grid.Panel',{
			title:'Debugging console',
			region:'east',
			split:true,
			width:400,
			store:store,
			dockedItems:[{
				dock:'top',
				xtype:'toolbar',
				items:dockedItems
			}],
			columns:[
				{header:'Timestamp', dataIndex:'timestamp', xtype:'datecolumn', format:'d.m.Y H:i:s', width:150},
				{header:'Typ', dataIndex:'type'},
				{header:'Daten', dataIndex:'data', flex:1}
			]
		}), {
			title:'Karte',
			region:'center',
			width:300,
			listeners:{
				render:function(container){
					var map = new google.maps.Map(this.body.dom, {
						center:new google.maps.LatLng(48.132501, 11.543460),
						zoom:14,
						mapTypeId:google.maps.MapTypeId.ROADMAP
					});
					this.on('resize', function(){
						google.maps.event.trigger(map, 'resize');
					});
				}
			}
		}]
	});

	var pushToStore = function(type, data) {
		var event = Ext.create('BGT.Event', {
			timestamp:new Date(),
			type:type,
			data:data
		});
		store.insert(0, event);
		while (store.getCount() > 30) store.removeAt(30);
	};

	var socket;
	var connect = function(){
		socket = new WebSocket('wss://' + location.hostname + '/bgt/socket');
		socket.subscribe = function(category){
			var me = this;
			if (category instanceof Array) return category.forEach(function(category){
				me.subscribe(category);
			});
			me.send(JSON.stringify({
				command:'subscribeUpdates',
				data:{category:category}
			}));
		};
		socket.unsubscribe = function(category){
			var me = this;
			if (category instanceof Array) return category.forEach(function(category){
				me.subscribe(category);
			});
			me.send(JSON.stringify({
				command:'unSubscribeUpdates',
				data:{category:category}
			}));
		};
		socket.onopen = function(){
			pushToStore('socket connected!');
			//socket.subscribe(['movements', 'quit', 'map', 'stats']);
		};
		socket.onmessage = function(message){
			pushToStore('message received' , message.data);
		};
		socket.onclose = function(){
			pushToStore('socket disconnected! waiting for reconnect...');
			setTimeout(connect, 5000);
		};
		socket.onerror = function(){
			pushToStore('socket error! reconnecting...');
			socket.close();
			connect();
		};
	};

	connect();
});
