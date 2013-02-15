var xml2js = require('xml2js'),
    fs = require('fs'),
    util = require('util');

module.exports = function(data, callback){
	var parser = new xml2js.Parser();

	var insertPoints = function(id, points) {
		var seq = 0;
		var outstanding = 0;
		var errors = [];
		var finish = function(){
			if (errors.length > 0) {
				util.log('there were ' + error.length + ' errors inserting gpx points!');
				return callback(errors[0]);
			}
			callback(true);
		};
		points.forEach(function(point){
			outstanding++;
			db.query().insert('points', ['map_id', 'seq', 'lat', 'lon'], [id, seq++, point['$'].lat, point['$'].lon]).execute(function(err){
				if (err) errors.push(err);
				if (--outstanding == 0) finish();
			});
		});
	};

	parser.on('end', function(result){
		if (result.gpx) result = result.gpx;
		if (!result.rte) throw new Error("Import is limited to GPX routes. Please convert your import accordingly.");
		var route = result.rte[0];
		var name = route.name[0];
		util.log('uploaded map received: ' + name);
		db.query().insert('map', ['title'], [name]).execute(function(err, result){
			if (err) throw err;
			insertPoints(result.id, route.rtept);
		});
	});

	parser.parseString(data.map);
}; 
