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

		var socketCallback = function(command){
			me.setLoading(false);
			if (command.wasSuccessful()) {
				if (!command.getResult().admin) return message.update("Login nur f&uuml;r Administratoren");
				me.hide();
				me.success();
				return;
			}
			message.update(command.getResult().message);
		};

		var handler = function(){
			me.setLoading();
			var socket = BGT.socket.Socket.getInstance();
			var data = form.getForm().getValues();
			socket.sendCommand(Ext.create('BGT.socket.commands.AuthCommand', data.user, data.pass, socketCallback));
		};

		var fbHandler = function(){
			FB.login(function(res){
				if (res.authResponse) fbLogin(res.authResponse);
			});
		};

		me.buttons = [{
			text:'Mit Facebook anmelden',
			handler:function(){
				if (typeof(FB) != 'undefined') fbHandler(); else window.fbQueue.push(fbHandler);
			}
		},{
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

		var fbLogin = function(auth){
			me.setLoading('Facebook Auto-Login');
			var socket = BGT.socket.Socket.getInstance();
			socket.sendCommand(Ext.create('BGT.socket.commands.FacebookLoginCommand', auth.accessToken, socketCallback));
		};

		var fbCheck = function(){
			FB.getLoginStatus(function(res){
				me.setLoading(false);
				if (res.status == 'connected') fbLogin(res.authResponse);
			});
		};

		me.on('afterrender', function(){
			me.setLoading();
			if (typeof(FB) != 'undefined') fbCheck(); else window.fbQueue.push(fbCheck);
		})

		me.callParent(arguments);
	}
});
