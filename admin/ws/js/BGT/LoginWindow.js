Ext.define('BGT.LoginWindow', {
	extend:'Ext.window.Window',
	title:'Bladeguard Admin Login',
	layout:'fit',
	items:[{
		xtype:'form',
		border:false,
		bodyStyle:{
			padding:'5px'
		},
		items:[{
			xtype:'textfield',
			fieldLabel:'Benutzername',
			name:'user'
		},{
			xtype:'textfield',
			fieldLabel:'Password',
			name:'pass'
		}]
	}],
	buttons:[{
		text:'Anmelden'
	}]
});
