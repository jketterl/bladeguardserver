var util = require('util'),
    https = require('https'),
    url = require('url')
    querystring = require('querystring');

BGT.Facebook = {
	Service:function(config){
		this.config = config;
	}
};

BGT.Facebook.Service.prototype = {
	getAccessToken:function(callback){
		me = this;
		if (me.accessToken) {
			return process.nextTick(function(){
				callback(me.accessToken);
			});
		}
		var req = {
			host:'graph.facebook.com',
			path:'/oauth/access_token?' + querystring.stringify({
				client_id:this.config.appId,
				client_secret:this.config.secret,
				grant_type:'client_credentials'
			}),
			method:'GET',
			protocol:'https:'
		}
		https.get(req, function(res){
			if (res.statusCode != 200) return callback(new Error('graph api returned status code ' + res.statusCode));
			var data = '';
			res.on('data', function(chunk){
				data += chunk.toString();
			});
			res.on('end', function(){
				var matches = /^access_token=(.+)$/.exec(data);
				if (!matches) return callback(new Error('response from graph api does not compute'));
				me.accessToken = matches[1];
				callback(me.accessToken);
			});
		});
	},
	getUserInfo:function(userId, callback){
		util.log('getting info for user "' + userId + '"');
		var me = this;
		me.getAccessToken(function(token){
			if (util.isError(token)) return util.log('Error getting facebook access token:\n' + token.stack);
			var req = {
				host:'graph.facebook.com',
				path:'/' + userId + '?' + querystring.stringify({
					'access_token':token
				}),
				method:'GET',
				protocol:'https:'
			};
			https.get(req, function(res){
				if (res.statusCode != 200) return callback(new Error('graph api returned status code ' + res.statusCode));
				var data = '';
				res.on('data', function(chunk){
					data += chunk.toString();
				});
				res.on('end', function(){
					data = JSON.parse(data);
					callback(data);
				});
			});
		});
	}
};

BGT.Facebook = new BGT.Facebook.Service(require('./config/facebook.json'));
