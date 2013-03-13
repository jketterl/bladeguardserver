module.exports = function(data, callback){
	if (typeof(data.pass) == 'undefined') return callback(new Error('pass must be set'));
	this.getUser().setPassword(data.pass, callback);
};
