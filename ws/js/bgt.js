bgt = function(target){
	var me = this;
	me.target = (target instanceof Node) ?  target : document.getElementById(target);
	if (typeof(WebSocket) != 'function') {
		bgt.target.innerHTML = "Ihr Browser unterst&uuml;tzt leider keine Websockets. Eine Kommunikation mit dem Bladenight-Server ist damit leider nicht m&ouml;glich.";
		return;
	}
	var script = document.createElement('script');
	script.src = 'http' + (top.location.protocol.match(/https/)?'s':'') + '://maps.googleapis.com/maps/api/js?key=AIzaSyAmp0-8zQX7MPin3jPgcmc-DqP7oSFA4v4&sensor=false&callback=bgt.onMapsReady';
	document.getElementsByTagName('head')[0].appendChild(script);
	
	bgt.onMapsReady = function(){
		me.init();
	}
};

bgt.prototype = {
	init:function(){
		var me = this;
		me.map = new google.maps.Map(me.target, {
			center:new google.maps.LatLng(48.132501, 11.543460),
			zoom:14,
			mapTypeId:google.maps.MapTypeId.ROADMAP
		});

		var socket;
		var connect = function () {
			socket = new WebSocket('wss://bgt.justjakob.de/bgt/socket');
			socket.onopen = function(){
				socket.send(JSON.stringify({handshake:{platform:'browser',version:'0.1.0',build:2}}));
				socket.send(JSON.stringify({command:'subscribeUpdates',data:{category:['map','movements','quit','stats']}}));
			};
			socket.onmessage = function(message){
				var data = JSON.parse(message.data);
				me.parseMessage(data);
			};
			socket.onerror = function(){
				try {
					socket.close();
				} catch (e) {}
				connect();
			};
		}
		connect();

		me.userMarkers = [];
		me.markerImage = new google.maps.MarkerImage(
			'img/map_pin.png',
			false,
			false,
			new google.maps.Point(7, 7)
		);
		me.trackOverlay = new google.maps.Polyline({
			path:[],
			strokeColor:'#FFC000',
			strokeWeight:6,
			strokeOpacity:1
		});
		me.trackOverlay.setMap(me.map);
		me.routeOverlay = new google.maps.Polyline({
			path:[],
			strokeColor:'#0000FF',
			strokeWeight:2,
			strokeOpacity:.5
		});
		me.routeOverlay.setMap(me.map);
	},
	parseMessage:function(data){
		var me = this;
		if (data.event && data.event == 'update') me.parseEvent(data.data);
	},
	parseEvent:function(data){
		var me = this;
		for (var a in data) {
			fn = 'process' + a.charAt(0).toUpperCase() + a.slice(1);
			if (!me[fn] || typeof(me[fn]) != 'function') return;
			me[fn](data[a]);
		}
	},
	processMap:function(maps){
		var me = this;
		var map = maps[0];


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
};
