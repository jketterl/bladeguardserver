this.process = function(request) {
	engine.addMapConnection(new BGTConnection(request.req, request.res));
}
