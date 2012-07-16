var util = require('util');

module.exports.process = function(req){
	if (req.req.method != 'PUT') {
		req.res.writeHead(400);
		return req.res.end('invalid request');
	}
	var data = '';
	req.req.on('data', function(chunk){
		data += chunk;
	});
	req.req.on('end', function(){
		try {
			data = JSON.parse(data);
		} catch (e) {
			util.log('could not parse json: "' + data + '"');
			req.res.writeHead(503, {'content-type':'application/json'});
			return req.res.end(JSON.stringify({message:'could not parse your data'}));
		}
		engine.bridges.olivier.updateUserLocation(data);
		req.res.writeHead(200, {'content-type':'application/json'});
		req.res.end(JSON.stringify({message:'OK'}));
	});
};
