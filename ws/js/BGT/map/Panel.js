Ext.define('BGT.map.Panel', {
	extend:'Ext.panel.Panel',
	constructor:function(){
		this.userMarkers = [];
		this.markerImage = new google.maps.MarkerImage(
			'/static/img/map_pin.png',
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

		var toSubscribe = ['map', 'movements', 'quit', 'stats'];

		var handlers = {};
		toSubscribe.forEach(function(cat){
			handlers[cat] = Ext.bind(me['process' + cat.charAt(0).toUpperCase() + cat.slice(1)], me);
		});

		me.on('show', function(){
			for (var cat in handlers) me.event.on(cat, handlers[cat]);
		});

		me.on('hide', function(){
			for (var cat in handlers) me.event.un(cat, handlers[cat]);
		});

		me.callParent(arguments);
	},
	processStats:function(stats){
		var me = this;
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
	processMovements:function(movement){
		var me = this;
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
	},
	processQuit:function(quit){
		var marker = me.userMarkers[quit.user.id];
		if (!marker) return;
		marker.setMap(null);
		delete me.userMarkers[quit.user.id];
	}
});
