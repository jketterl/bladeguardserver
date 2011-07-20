var https = require('https');
var fs = require('fs');
require('./engine');
engine = new BGTEngine();
require('./router');
var router = new BGTRouter();
require('./connection');

var options = {
  key: fs.readFileSync('/usr/local/apache2/conf/server.key'),
  cert: fs.readFileSync('/usr/local/apache2/conf/server.crt')
};

https.createServer(options, function (req, res) {
  console.log('connect: ' + req.url);
  var request = router.parse(req.url);
  request.req = req; request.res = res;
  var module = engine.loadModule(request);
  module.process(request);
}).listen(8000);
