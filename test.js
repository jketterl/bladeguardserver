BGT = {
		GCM: {}
};
var config = require('./config/gcm.json');
require('./gcm');
db = require('./db');

db.connect(function(){
	var gcm = new BGT.GCM.Service(config);

	gcm.sendBroadcastMessage(
		{message:"Hello World"}
	);
});
