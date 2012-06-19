var xml2js = require('xml2js'),
    fs = require('fs');

var args = process.argv.splice(2);

var parser = new xml2js.Parser();

var insertPoints = function(id, points) {
	console.info('inserting data into id: ' + id);
	points.forEach(function(point){
		console.info(point['@'].lat + ':' + point['@'].lon);
	});
};

parser.on('end', function(result){
	console.info("loaded map: " + result.rte.name);
	if (typeof(args[1]) != 'undefined') {
		insertPoints(args[1], result.rte.rtept);
	}
});

fs.readFile(args[0], function(err, data){
	if (err) throw err;
	parser.parseString(data);
});
