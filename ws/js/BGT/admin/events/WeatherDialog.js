Ext.define('BGT.admin.events.WeatherDialog', {
	extend:'Ext.window.Window',
	title:'Wetterentscheidung',
	callback:Ext.emptyFn,
	bodyStyle:{
		padding:'10px'
	},
	initComponent:function(){
		var me = this;

		var combo = Ext.create('Ext.form.field.ComboBox', {
			fieldLabel:'Entscheidung',
			store:[
				[0, 'F&auml;llt leider aus'],
				[1, 'Ja, wir fahren']
			],
			value:1
		});

		me.items = [combo]

		me.buttons = [{
			text:'Abbrechen',
			handler:function(){
				me.close();
				me.callback();
			}
		},{
			text:'OK',
			handler:function(){
				me.close();
				me.callback(combo.getValue());
			}
		}];
		me.callParent(arguments);
	}
});
