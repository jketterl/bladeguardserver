BGTRouter = function(){
	this.regex = new RegExp('^\\/bgt\\/([a-z]+)(\\?(.*))?');
}

BGTRouter.prototype.getModule = function(url){
	var moduleName = 'error';
	var result = this.regex.exec(url);
	if (result != null) moduleName = result[1];
	return moduleName;
}
