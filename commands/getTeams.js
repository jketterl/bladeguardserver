module.exports = function(data, callback){
	db.query().select('id, name').from('team').where('active').execute(function(err, rows){
		if (err) return callback(err);
		callback(rows);
	});
};
