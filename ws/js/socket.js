var socket = new WebSocket('wss://' + location.hostname + '/bgt/socket');
var print = function(text){
	var div = document.getElementById('events');
	var el = document.createElement('div');
	el.innerHTML = text;
	div.appendChild(el);
};
socket.onopen = function(){
	print('socket connected!');
};
socket.onmessage = function(message){
	print('message received: "' + message.data + '"');
};
