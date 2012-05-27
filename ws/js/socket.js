var socket = new WebSocket('wss://' + location.hostname + '/bgt/socket');
socket.onopen = function(){
	console.info('connected!');
};
socket.onmessage = function(message){
	console.info(message);
};
