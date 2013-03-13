Ext.define('BGT.admin.users.Grid', {
	extend:'Ext.grid.Panel',
	requires:[
		'BGT.admin.users.User'
	],
	title:'Benutzerverwaltung',
	closable:true,
	columns:[
		{header:'ID', dataIndex:'id', hidden:true},
		{header:'Name', dataIndex:'name', flex:2},
		{header:'Team', dataIndex:'team_name', flex:1},
		{header:'Admin', dataIndex:'admin', xtype:'booleancolumn', trueText:'Ja', falseText:'Nein'}
	],
	store:{
		model:'BGT.admin.users.User',
		autoLoad:true
	},
	dockedItems:[{
		dock:'top',
		xtype:'toolbar',
		items:[{
			text:'Neuen Benutzer anlegen...',
			handler:function(){
				var form = Ext.create('BGT.admin.users.Form', {
					border:false,
					bodyStyle:{
						padding:'10px'
					},
					width:300
				});
				var window = Ext.create('Ext.window.Window', {
					layout:'fit',
					title:'Neuen Benutzer anlegen',
					items:[form],
					buttons:[{
						text:'Abbrechen',
						handler:function(){
							window.close();
						}
					},{
						text:'OK',
						handler:function(){
							var data = form.getForm().getFieldValues();
							var message = false;
							if (data.pass == '') message = 'Das Passwort darf nicht leer sein';
							if (data.pass != data.confirm) message = 'Die eingegebenen Passwörter stimmen nicht überein';

							if (message) {
								Ext.Msg.show({
									title:'Fehler',
									msg:message,
									buttons:Ext.Msg.OK,
									icon:Ext.Msg.ERROR
								});
								return;
							}

							window.setLoading();
							var user = Ext.create('BGT.admin.users.User');
							form.getForm().updateRecord(user);
							user.save({
								callback:function(){
									window.setLoading(false);
									window.dismiss();
								}
							});
						}
					}]
				});
				window.show();
			}
		}]
	}]
});
