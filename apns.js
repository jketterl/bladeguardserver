var tls = require('tls'),
    fs = require('fs');
var options = require('./config/apns.json');

var callbacks = 0;
['key', 'cert'].forEach(function(type){
	callbacks++;
	fs.readFile(options[type], function(err, data){
		if (err) throw err;
		options[type] = data;
		if (--callbacks == 0) startConnection();
	});
});

var startConnection = function(){
	var stream = tls.connect(options, function(){
		console.info(stream);
	});
};
