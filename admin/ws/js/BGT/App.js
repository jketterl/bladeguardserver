Ext.define('BGT.App', {
	extend:'Ext.container.Viewport',
	initComponent:function(){
		var me = this;

		var adminStore = Ext.create('Ext.data.TreeStore', {
			root:{
				expanded:true,
				children:[{
					text:'Blade Nights',
					leaf:true,
					cls:'BGT.admin.events.Grid'
				},{
					text:'Benutzer',
					leaf:true,
					cls:'BGT.admin.users.Grid'
				},{
					text:'Teams',
					leaf:true,
					cls:'BGT.admin.team.Grid'
				},{
					text:'Strecken',
					leaf:true,
					cls:'BGT.admin.map.Grid'
				}]
			}
		});

		var content = Ext.create('Ext.TabPanel', {
			region:'center'
		});

		var panels = {};

		me.items = [
			{
				region:'west',
				width:200,
				layout:'accordion',
				items:[{
					title:'Administration',
					xtype:'treepanel',
					store:adminStore,
					rootVisible:false,
					listeners:{
						itemclick:function(tree, record){
							var cls = record.get('cls');
							if (!panels[cls]){
								var panel = Ext.create(cls);
								panels[cls] = panel;
								content.add(panel);
								panel.on('close', function(){
									delete panels[cls];
								});
							}
							return content.setActiveTab(panels[cls]);
						}
					}
				}]
			},
			content
		];
		me.layout = 'border';
		me.callParent(arguments);
	}
});
