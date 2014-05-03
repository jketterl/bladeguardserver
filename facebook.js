var util = require('util'),
    https = require('https'),
    url = require('url')
    querystring = require('querystring'),
    moment = require('moment');

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
	verifyUserSession:function(accessToken, callback){
		var me = this;
		var req = {
			host:'graph.facebook.com',
			path:'/me?' + querystring.stringify({
				'fields':'installed',
				'access_token':accessToken,
			}),
			method:'GET'
		};
		https.get(req, function(res){
			if (res.statusCode != 200) return callback(new Error('user session invalid; http response code: ' + res.statusCode));
			var data = '';
			res.on('data', function(chunk){
				data += chunk.toString();
			});
			res.on('end', function(){
				data = JSON.parse(data);
				if (!data.installed) return callback(new Error('you must allow this app to access your facebook information'));
				callback(data);
			});
		});
	},
	getUserInfo:function(userId, callback){
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
					me.isAdmin(userId, function(isAdmin){
						data.admin = isAdmin;
						callback(data);
					});
				});
			});
		});
	},
	getRoles:function(callback){
		var me = this;
		me.getAccessToken(function(token){
			https.get({
				host:'graph.facebook.com',
				path:'/' + me.config.appId + '/roles?' + querystring.stringify({
					'access_token':token
				}),
				method:'GET'
			}, function(res){
				var data = '';
				res.on('data', function(chunk){
					data += chunk.toString();
				});
				res.on('end', function(){
					data = JSON.parse(data);
					var roles = {};
					data.data.forEach(function(entry){
						if (!roles[entry.role]) roles[entry.role] = [];
						roles[entry.role].push(entry.user);
					});
					callback(roles);
				});
			});
		});
	},
	isAdmin:function(userId, callback){
		var me = this;
		me.getRoles(function(roles){
			callback(roles.administrators && roles.administrators.indexOf(userId) >= 0);
		});
	},
    postStory:function(user, event, callback){
        var me = this;
        me.getAccessToken(function(token){
            var data = {
                "method":'POST',
                "blade_night":'https://bgt.justjakob.de/event/' + event.id + '.html',
                "end_time":moment(event.end).toISOString(),
                "access_token":token
            };
            if (event.actualStart) data.start_time = moment(event.actualStart).toISOString();

            var req = https.request({
                method:'POST',
                host:'graph.facebook.com',
                path:'/v2.0/' + user.id + '/de-justjakob-bgt:participate?' + querystring.stringify(data)
            }, function(res){
                var data = '';
                res.on('data', function(chunk) { data += chunk; } );
                res.on('end', function(){
                    //{"error":{"message":"The global ID 1798576571 is not allowed. Please use the application specific ID instead.","type":"OAuthException","code":2500}}
                    data = JSON.parse(data);
                    if (data.error) return callback(new Error(data.error.message));
                    callback(data.id);
                });
            })
            
            req.end();
        });
    },
    deleteStory: function(storyId, callback){
        var me = this;
        me.getAccessToken(function(token){
            var req = https.request({
                method:'DELETE',
                host:'graph.facebook.com',
                path:'/v2.0/' + storyId + '?' + querystring.stringify({
                    "method":'DELETE',
                    "access_token":token
                })
            }, function(res){
                var data = '';
                res.on('data', function(chunk) { data += chunk; } );
                res.on('end', function(){
                    data = JSON.parse(data);
                    if (data.error) return callback(new Error(data.error.message));
                    callback();
                });
            });

            req.end();
        });
    },
    updateStory: function(storyId, data, callback){
        var me = this;

        me.getAccessToken(function(token){
            data.method = 'POST';
            data.access_token = token;

            var req = https.request({
                method:'POST',
                host:'graph.facebook.com',
                path:'/v2.0/' + storyId + '?' + querystring.stringify(data)
            }, function(res){
                var data = '';
                res.on('data', function(chunk) { data += chunk; } );
                res.on('end', function(){
                    data = JSON.parse(data);
                    if (data.error) return callback(new Error(data.error.messaage));
                    callback();
                });
            });

            req.end();
        });
    }
};

BGT.Facebook = new BGT.Facebook.Service(require('./config/facebook.json'));
