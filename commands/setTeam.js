module.exports = function(data, callback){
	if (typeof(data.id) == 'undefined') process.nextTick(function(){
		callback(new Error('no team id provided'));
	});
	this.getUser().setTeam(data.id, callback);
};
