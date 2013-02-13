Ext.define('BGT.App', {
	extend:'Ext.container.Viewport',
	initComponent:function(){
		var me = this;
		me.items = [{
			region:'west',
			html:'Navigation',
			width:200
		},{
			region:'center',
			html:'Content'
		}];
		me.layout = 'border';
		me.callParent(arguments);
	}
});
