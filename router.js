var querystring = require('querystring');

BGTRouter = function(){
	this.regex = /^\/bgt\/([a-z]+)((\/[a-zA-Z\.\-_]*)*)(\?(.*))?$/;
}

BGTRouter.prototype.parse = function(url){
	var request = {module:'error'};
	var result = this.regex.exec(url);
	if (result != null) {
		request = querystring.parse(result[5]);
		request.module = result[1];
		if (result[2]) request.path = result[2];
	}
	return request;
}
