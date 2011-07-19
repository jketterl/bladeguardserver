var https = require('https');
var fs = require('fs');
require('./engine');
var engine = new BGTEngine();
require('./router');
var router = new BGTRouter();

var options = {
  key: fs.readFileSync('/usr/local/apache2/conf/server.key'),
  cert: fs.readFileSync('/usr/local/apache2/conf/server.crt')
};

https.createServer(options, function (req, res) {
  console.log('connect: ' + req.url);
  console.log(router.getModule(req.url));
  res.writeHead(200);
  res.end();
}).listen(8000);
