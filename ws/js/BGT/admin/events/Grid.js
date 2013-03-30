Ext.define('BGT.admin.events.Grid', {
	extend:'Ext.grid.Panel',
	requires:[
		'BGT.socket.Socket',
		'BGT.events.Event',
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
		}},
		{header:'Echter Start', dataIndex:'actualStart', xtype:'datecolumn', format:'d.m.Y H:i:s', width:150},
		{header:'Echtes Ende', dataIndex:'actualEnd', xtype:'datecolumn', format:'d.m.Y H:i:s', width:150}
	],
	store:{
		model:'BGT.events.Event',
		autoLoad:true
	},
	initComponent:function(){
		var me = this;
		var weatherButton = Ext.create('Ext.button.Button', {
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
		var mapButton = Ext.create('Ext.button.Button', {
			text:'Auf der Karte anzeigen',
			disabled:true,
			handler:function(){
				var event = me.getSelectionModel().getSelection()[0];
				BGT.App.instance.showPanel(Ext.create('BGT.admin.map.Panel', {
					title:event.get('title'),
					closable:true,
					event:event
				}));
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
									window.setLoading();
									var event = Ext.create('BGT.events.Event');
									form.getForm().updateRecord(event);
									event.save({
										callback:function(){
											window.close();
											me.store.load();
										}
									});
								}
							}]
						});
						window.show();
					}
				},
				weatherButton,
				mapButton
			]
		}];
		me.selModel = {
			listeners:{
				select:function(){
					weatherButton.enable();
					mapButton.enable();
				}
			}
		};
		this.callParent(arguments);
	}
});
