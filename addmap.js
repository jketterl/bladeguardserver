var xml2js = require('xml2js'),
    fs = require('fs'),
    util = require('util');
var db = new (require('db-mysql').Database)(require('./config/db.json'));

var args = process.argv.splice(2);

var parser = new xml2js.Parser();

var insertPoints = function(id, points) {
	console.info('inserting data into id: ' + id);
	var seq = 0;
	points.forEach(function(point){
		db.query().insert('points', ['map_id', 'seq', 'lat', 'lon'], [id, seq++, point['$'].lat, point['$'].lon]).execute(function(err){
			if (err) throw err;
		});
	});
};

parser.on('end', function(result){
	if (result.gpx) result = result.gpx;
	if (!result.rte) throw new Error("Import is limited to GPX routes. Please convert your import accordingly.");
	var route = result.rte[0];
	var name = route.name[0];
	util.log('loaded map: ' + name);
	if (typeof(args[1]) != 'undefined') {
		insertPoints(args[1], route.rtept);
	} else {
		db.query().insert('map', ['title'], [name]).execute(function(err, result){
			if (err) throw err;
			insertPoints(result.id, route.rtept);
		});
	}
});


db.connect(function(err){
	if (err) throw err;
	fs.readFile(args[0], function(err, data){
		if (err) throw err;
		parser.parseString(data.toString());
	});
}); 
