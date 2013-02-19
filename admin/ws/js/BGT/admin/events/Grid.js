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
		{name:'weather', defaultValue:null}
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
	requires:[
		'BGT.socket.Socket'
	],
	title:'Blade Night Liste',
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
	initComponent:function(){
		var me = this,
		    weatherButton = Ext.create('Ext.button.Button', {
			text:'Wetterentscheidung...',
			disabled:true,
			handler:function(){
				var event = me.getSelectionModel().getSelection()[0];
				var dialog = Ext.create('BGT.admin.events.WeatherDialog', {
					callback:function(value){
						if (typeof(value) == 'undefined') return;
						me.setLoading();
						var command = Ext.create('BGT.socket.commands.UpdateEventCommand', event, value, function(){
							me.setLoading(false);
							me.store.load();
						});
						BGT.socket.Socket.getInstance().sendCommand(command);
					}
				});
				dialog.show();
			}
		});
		me.dockedItems = [{
			xtype:'toolbar',
			dock:'top',
			items:[
				{
					xtype:'button',
					text:'Neue Blade Night',
					handler:function(){
						var form = Ext.create('BGT.admin.events.Form', {
							border:false,
							bodyStyle:{
								padding:'10px'
							},
							width:500
						});
						var window = Ext.create('Ext.window.Window', {
							title:'Neuen Termin anlegen',
							layout:'fit',
							items:[form],
							buttons:[{
								text:'Abbrechen',
								handler:function(){
									window.close();
								}
							},{
								text:'OK',
								handler:function(){
									var event = Ext.create('BGT.admin.events.Event');
									form.getForm().updateRecord(event);
									console.info(event);
								}
							}]
						});
						window.show();
					}
				},
				weatherButton
			]
		}];
		me.selModel = {
			listeners:{
				select:function(){
					weatherButton.enable();
				}
			}
		};
		this.callParent(arguments);
	}
});
