Ext.define('BGT.data.reader.Graphite', {
	extend:'Ext.data.reader.Array',
	alias:'reader.graphite',
	getData:function(data){
		return data[0].datapoints;
	}
});

Ext.define('BGT.admin.map.LengthPoint', {
	extend:'Ext.data.Model',
	fields:[
		'value',
		{name:'timestamp', type:'date', dateFormat:'timestamp'}
	],
	proxy:{
		type:'rest',
		reader:'graphite',
		url:'http://graphite.justjakob.de/render'
	}
});

Ext.define('BGT.admin.map.Panel', {
	extend:'Ext.panel.Panel',
	layout:'border',
	initComponent:function(){
		var me = this;
		var items = me.items = [];

		var map = Ext.create('BGT.map.Panel', {
			region:'center',
			event:me.event
		});
		map.relayEvents(me, ['show', 'hide']);
		items.push(map);

		var store = Ext.create('Ext.data.Store', {
			model:'BGT.admin.map.LengthPoint'
		});

		var lengthGraph = Ext.create('Ext.chart.Chart', {
			width:200,
			height:200,
			store:store,
			axes:[{
				type:'Numeric',
				position:'left',
				fields:['value'],
				minimum:0
			},
			{
				type:'Time',
				position:'bottom',
				fields:'timestamp',
				dateFormat:'H:i',
				step:[Ext.Date.MINUTE, 1]
			}],
			series:[{
				type:'line',
				showMarkers:false,
				xField:'timestamp',
				yField:'value',
				axis:['left', 'bottom']
			}]
		});

		var graphPanel = Ext.create('Ext.panel.Panel', {
			region:'east',
			width:200,
			collapsible:true,
			collapseMode:'mini',
			split:true,
			header:false,
			items:[
				lengthGraph
			]
		});

		items.push(graphPanel);

		Ext.TaskManager.start({
			run:function(){
				store.load({
					params:{
						from:'-2h',
						target:'bgt.stats.' + me.event.get('id') + '.bladeNightLength',
						format:'json'
					}
				});
			},
			interval:60000
		});

		me.callParent(arguments);
	}
});
