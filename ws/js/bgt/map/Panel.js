Ext.define('BGT.map.Panel', {
	extend:'Ext.panel.Panel',
	constructor:function(){
		this.userMarkers = [];
		this.markerImage = new google.maps.MarkerImage(
			'img/map_pin.png',
			false,
			false,
			new google.maps.Point(7, 7)
		);
		this.trackOverlay = new google.maps.Polyline({
			path:[],
			strokeColor:'#FFC000',
			strokeWeight:6,
			strokeOpacity:1
		});
		this.routeOverlay = new google.maps.Polyline({
			path:[],
			strokeColor:'#0000FF',
			strokeWeight:2,
			strokeOpacity:.5
		});
		this.callParent(arguments);
	},
	listeners:{
		render:function(container){
			var me = container;
			me.map = new google.maps.Map(this.body.dom, {
				center:new google.maps.LatLng(48.132501, 11.543460),
				zoom:14,
				mapTypeId:google.maps.MapTypeId.ROADMAP
			});
			this.on('resize', function(){
				google.maps.event.trigger(container.map, 'resize');
			});
			me.trackOverlay.setMap(me.map);
			me.routeOverlay.setMap(me.map);
		}
	},
	initComponent:function(){
		var me = this;

		me.socket.on('connect', function(){
			me.socket.subscribe(['map', 'movements', 'quit', 'stats']);
			me.userMarkers.forEach(function(marker){
				marker.setMap(null);
			});
			me.userMarkers = [];
			if (me.routeOverlay) me.routeOverlay.setPath([]);
			if (me.trackOverlay) me.trackOverlay.setPath([]);
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
	processStats:function(stats){
		var me = this;
		stats = stats[0];
		var coordinates = [];
		if (stats.between) {
			var i = stats.between[0];
			while (i != stats.between[1]) {
				coordinates.push(me.coordinates[i]);
				i++;
				if (i >= me.coordinates.length) i = 0;
			}
		}
		me.trackOverlay.setPath(coordinates);
	},
	processMap:function(map){
		var me = this;
		map = map[0];


		var coordinates = [];
		var bounds;
		map.points.forEach(function(point){
			var coord = new google.maps.LatLng(point.lat, point.lon);
			coordinates.push(coord);
			if (!bounds) {
				bounds = new google.maps.LatLngBounds(coord, coord);
			} else {
				bounds.extend(coord);
			}
		});

		me.routeOverlay.setPath(coordinates);

		me.coordinates = coordinates;

		me.map.fitBounds(bounds);
	},
	processMovements:function(movements){
		var me = this;
		movements.forEach(function(movement){
			var marker = me.userMarkers[movement.user.id];
			var position = new google.maps.LatLng(movement.location.lat, movement.location.lon)
			if (!marker) {
				marker = new google.maps.Marker({
					position:position,
					map:me.map,
					title:movement.user.name,
					icon:me.markerImage
				});
				me.userMarkers[movement.user.id] = marker;
			} else {
				marker.setPosition(position);
			}
		});
	},
	processQuit:function(quits){
		var me = this;
		quits.forEach(function(quit){
			var marker = me.userMarkers[quit.user.id];
			if (!marker) return;
			marker.setMap(null);
			delete me.userMarkers[quit.user.id];
		});
	}
});
