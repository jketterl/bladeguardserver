module.exports = function(data){
	this.getEvent(data).getEngine().removeUser(this.getUser());
};
