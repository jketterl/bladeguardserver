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
		this.callParent(arguments);
	},
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
			me.socket.subscribe(['map', 'movements', 'quit']);
			me.userMarkers.forEach(function(marker){
				marker.setMap(null);
			});
			me.userMarkers = [];
			if (me.routeOverlay) me.routeOverlay.setMap(setPath([]));
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

		if (!me.routeOverlay) {
			me.routeOverlay = new google.maps.Polyline({
				path:coordinates,
				strokeColor:'#0000FF',
				strokeWeight:2,
				strokeOpacity:.75
			});
			me.routeOverlay.setMap(me.map);
		} else {
			me.routeOverlay.setPath(coordinates);
		}

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
