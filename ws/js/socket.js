var htmlEntities = function(str) {
	return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};
var print = function(text){
	var div = document.getElementById('events');
	var el = document.createElement('div');
	el.innerHTML = text;
	div.insertBefore(el, div.childNodes[0]);
};


var connect = function(){
	var socket = new WebSocket('wss://' + location.hostname + '/bgt/socket');
	socket.onopen = function(){
		print('socket connected!');
	};
	socket.onmessage = function(message){
		console.info(message);
		print('message received: "' + htmlEntities(message.data) + '"');
	};
	socket.onclose = function(){
		print('socket disconnected! waiting for reconnect...');
		setTimeout(connect, 5000);
	}
};

connect();
