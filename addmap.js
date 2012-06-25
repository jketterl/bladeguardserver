var xml2js = require('xml2js'),
    fs = require('fs'),
    util = require('util'),
    db = require('./db');

var args = process.argv.splice(2);

var parser = new xml2js.Parser();

var insertPoints = function(id, points) {
	console.info('inserting data into id: ' + id);
	var seq = 0;
	points.forEach(function(point){
		db.query().insert('points', ['map_id', 'seq', 'lat', 'lon'], [id, seq++, point['@'].lat, point['@'].lon]).execute(function(err){
			if (err) throw err;
		});
	});
};

parser.on('end', function(result){
	util.log('loaded map: ' + result.rte.name);
	if (typeof(args[1]) != 'undefined') {
		insertPoints(args[1], result.rte.rtept);
	} else {
		//TODO: implement mysql query to insert a new map here & call insertPoints afterwards
		util.log('inserting into mysql not supported yet');
	}
});


db.connect(function(err){
	if (err) throw err;
	fs.readFile(args[0], function(err, data){
		if (err) throw err;
		parser.parseString(data);
	});
}); 
