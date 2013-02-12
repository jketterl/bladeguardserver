Ext.define('BGT.LoginWindow', {
	extend:'Ext.window.Window',
	requires:'BGT.Socket',
	title:'Bladeguard Admin Login',
	layout:'fit',
	initComponent:function(){
		var me = this;
		var form = Ext.create('Ext.form.Panel', {
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
				inputType:'password',
				name:'pass'
			}]
		});
		me.items = [form];
		me.buttons = [{
			text:'Anmelden',
			handler:function(){
				var socket = BGT.Socket.getInstance();
				socket.sendCommand({'command':'auth','data':form.getForm().getValues()});
			}
		}]
		me.callParent(arguments);
	}
});
