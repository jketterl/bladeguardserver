var querystring = require('querystring');

BGTRouter = function(){
	this.regex = new RegExp('^\\/bgt\\/([a-z]+)(\\?(.*))?');
}

BGTRouter.prototype.parse = function(url){
	var request = {module:'error'};
	var result = this.regex.exec(url);
	if (result != null) {
		var request = querystring.parse(result[3]);
		request.module = result[1];
	}
	return request;
}
