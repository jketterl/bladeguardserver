Ext.define('BGT.LoginWindow', {
	extend:'Ext.window.Window',
	requires:'BGT.socket.Socket',
	title:'Bladeguard Admin Login',
	layout:'fit',
	success:Ext.emptyFn,
	initComponent:function(){
		var me = this;

		var message = Ext.create('Ext.panel.Panel', {
			border:false
		});

		var form = Ext.create('Ext.form.Panel', {
			border:false,
			bodyStyle:{
				padding:'5px'
			},
			items:[
				{
					xtype:'textfield',
					fieldLabel:'Benutzername',
					name:'user'
				},{
					xtype:'textfield',
					fieldLabel:'Password',
					inputType:'password',
					name:'pass'
				},
				message
			]
		});
		me.items = [form];

		var handler = function(){
			me.setLoading();
			var socket = BGT.socket.Socket.getInstance();
			var data = form.getForm().getValues();
			socket.sendCommand(Ext.create('BGT.socket.commands.AuthCommand', data.user, data.pass, function(command){
				me.setLoading(false);
				if (command.wasSuccessful()) {
					me.hide();
					me.success();
					return;
				}
				message.update(command.getResult().message);
			}));
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
