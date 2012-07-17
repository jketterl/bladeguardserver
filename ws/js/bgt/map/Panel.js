Ext.define('BGT.map.Panel', {
	extend:'Ext.panel.Panel',
	listeners:{
		render:function(container){
			container.map = new google.maps.Map(this.body.dom, {
				center:new google.maps.LatLng(48.132501, 11.543460),
				zoom:14,
				mapTypeId:google.maps.MapTypeId.ROADMAP
			});
			this.on('resize', function(){
				google.maps.event.trigger(container.map, 'resize');
			});
		}
	},
	initComponent:function(){
		var me = this;

		me.socket.on('connect', function(){
			me.socket.subscribe(['map']);
		});
		me.socket.on('message', function(data){
			me.parseIncomingMessage(data);
		});

		me.callParent(arguments);
	},
	parseIncomingMessage:function(data){
		var me = this;
		if (!data.event || data.event != 'update') return;
		for (var a in data.data) {
			fn = 'process' + a.charAt(0).toUpperCase() + a.slice(1);
			if (!me[fn] || typeof(me[fn]) != 'function') return;
			me[fn](data.data[a]);
		}
	},
	processMap:function(map){
		var me = this;
		map = map[0];

		if (me.routeOverlay) me.routeOverlay.setMap(null);

		var coordinates = [];
		map.points.forEach(function(point){
			coordinates.push(new google.maps.LatLng(point.lat, point.lon));
		})

		me.routeOverlay = new google.maps.Polyline({
			path:coordinates,
			strokeColor:'#0000FF',
			strokeWeight:2,
			strokeOpacity:.75
		});
		me.routeOverlay.setMap(me.map);
	}
});
