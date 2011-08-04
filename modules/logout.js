this.process = function(request) {
	request.session.setData({});
	request.res.writeHead(200);
	request.res.end('logout successful');
}
