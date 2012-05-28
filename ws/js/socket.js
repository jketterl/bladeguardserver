var socket = new WebSocket('wss://' + location.hostname + '/bgt/socket');
var print = function(text){
	var div = document.getElementById('events');
	var el = document.createElement('div');
	el.innerHTML = text;
	div.insertBefore(el, div.childNodes[0]);
};
function htmlEntities(str) {
	return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
socket.onopen = function(){
	print('socket connected!');
};
socket.onmessage = function(message){
	console.info(message);
	print('message received: "' + htmlEntities(message.data) + '"');
};
