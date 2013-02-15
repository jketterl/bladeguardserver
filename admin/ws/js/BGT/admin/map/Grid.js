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
	requires:[
		'BGT.socket.Socket'
	],
	title:'Strecken',
	closable:true,
	columns:[
		{header:'ID', dataIndex:'id', hidden:true},
		{header:'Name', dataIndex:'name', flex:1}
	],
	store:{
		model:'BGT.admin.map.Map',
		autoLoad:true
	},
	dockedItems:[{
		xtype:'toolbar',
		dock:'top',
		items:[{
			text:'Neue Strecke hochladen (GPX-Datei)',
			handler:function(){
				var window = Ext.create('Ext.window.Window', {
					title:'Dateiupload',
					layout:'fit',
					items:[{
						xtype:'form',
						border:false,
						bodyStyle:{
							padding:'5px'
						},
						items:[{
							xtype:'filefield',
							name:'file',
							fieldLabel:'Datei'
						}]
					}],
					buttons:[{
						text:'OK',
						handler:function(){
							window.setLoading();
							var reader = new FileReader();
							reader.onload = function(e){
								var gpx = e.target.result;
								var command = Ext.create('BGT.socket.commands.UploadMapCommand', gpx, function(command){
									window.close();
									if (!command.wasSuccessful()) return Ext.Msg.show({
										title:'Error',
										msg:command.getResult().message,
										buttons:Ext.Msg.OK,
										icon:Ext.Msg.Error
									});
								});
								BGT.socket.Socket.getInstance().sendCommand(command);
							};
							reader.readAsText(window.down('form').down('[name=file]').extractFileInput().files[0]);
						}
					}]
				});
				window.show();
			}
		}]
	}]
});
