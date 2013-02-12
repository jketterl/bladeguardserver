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

		var handler = function(){
			var socket = BGT.Socket.getInstance();
			socket.sendCommand({'command':'auth','data':form.getForm().getValues()});
		};

		me.buttons = [{
			text:'Anmelden',
			handler:handler
		}];

		me.on('show', function(){
			form.items.get(0).focus(null, 10);
		});

		me.on('afterrender', function(){
			Ext.create('Ext.util.KeyNav', me.getEl(), {
				enter:handler
			});
		});

		me.callParent(arguments);
	}
});
