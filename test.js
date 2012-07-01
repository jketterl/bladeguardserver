BGT = {
		GCM: {}
};
var config = require('./config/gcm.json');
require('./gcm');
db = require('./db');

var gcm = new BGT.GCM.Service(config);

gcm.sendBroadcastMessage(
	{command:"start",data:{eventId:2}}
);