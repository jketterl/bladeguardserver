var util = require('util');
var crypto = require('crypto');

BGTUser = function(data) {
	for (var a in data) {
		this[a] = data[a];
	}
	this.uid = BGTUser.generateUid();
	// this line turns on stats tracking for anonymous users.
	if (typeof(this.stats) == 'undefined') this.stats = true;
}

var EventEmitter = require('events').EventEmitter;
util.inherits(BGTUser, EventEmitter);

BGTUser.users = []

BGTUser.login = function(user, pass, callback) {
	var me = this;
	var hash = crypto.createHash('md5').update(pass).digest('hex');
	db.query().
		select('users.id as id, users.name, team.name as team_name, users.admin, team.stats as stats').
		from('users').
		join({table:'team', type:'left', conditions:'users.team_id = team.id'}).
		where('users.name = ? and pass = ?', [user, hash]).
		execute(function(err, rows, cols) {
			if (err) {
				return callback(err);
			}
			if (rows.length == 0) {
				return callback(new Error('user or password incorrect'));
			}
			if (typeof(BGTUser.users[rows[0].id]) != 'undefined') {
				callback(null, BGTUser.users[rows[0].id]);
			} else {
				callback(null, BGTUser.addUser(new BGTUser(rows[0])));
			}
		});
};

BGTUser.getAll = function(callback){
	var me = this;
	db.query().
		select('users.id as id, users.name, team.name as team_name, users.admin, team.stats as stats').
		from('users').
		join({table:'team', type:'left', conditions:'users.team_id = team.id'}).
		execute(function(err, rows){
			if (err) return callback(err);
			var result = [];
			rows.forEach(function(row){
				if (typeof(BGTUser.users[row.id]) != 'undefined') {
					result.push(BGTUser.users[row.id]);
				} else {
					result.push(BGTUser.addUser(new BGTUser(row)));
				}
			});
			callback(null, result);
		});
};

BGTUser.generateUid = function(){
	if (!BGTUser.uidOffset) BGTUser.uidOffset = 0;
	return BGTUser.uidOffset++;
};

BGTUser.getAnonymousUser = function() {
	var user = new BGTUser({});
	user.anonymous = true;
	return user;
};

BGTUser.addUser = function(user) {
        BGTUser.users[user.id] = user;
	return user;
}

BGTUser.prototype.isAdmin = function() {
	return this.admin && true;
}

BGTUser.prototype.getName = function() {
	if (this.name) return this.name;
	return 'anonymous user #' + this.uid
}

BGTUser.prototype.getTeam = function() {
	return this.team_name || 'Bladeguard';
}

BGTUser.prototype.toString = function() {
	return this.getName();
}

BGTUser.prototype.setTeam = function(id, callback) {
	var me = this;
	db.query().select('id, name').from('team').where('id = ?', [id]).execute(function(err, result){
		if (err) return callback(err);
		if (result.length == 0) return callback(new Error("Team not found."));
		var team = result[0];
		me.team_name = team.name;
		db.query().update('users').set({team_id:id}).where('id = ?', [me.id]).execute(function(err, result){
			return callback(err ? err : team);
		});
	});
};

BGTUser.prototype.setPassword = function(pass, callback) {
	var me = this;
	var hash = crypto.createHash('md5').update(pass).digest('hex');
	db.query().update('users').set({pass:hash}).where('id = ?', [me.id]).execute(function(err, result){
		return callback(err ? err : true);
	});	
};

BGTUser.prototype.toJSON = function(){
	var res = {}, me = this;
	['uid', 'name', 'team_name', 'admin'].forEach(function(offset){
		res[offset] = me[offset];
	});
	return res;
};

BGTUser.prototype.updateLocation = function(location){
	this.location = location;
};

BGTFacebookUser = function(data){
	BGTFacebookUser.super_.call(this, {
		id:data.id,
		name:data.name,
		admin:data.admin,
		team_name:data.team_name
	});
};

util.inherits(BGTFacebookUser, BGTUser);

BGTFacebookUser.users = [];

BGTFacebookUser.addUser = function(user){
	BGTFacebookUser.users[user.id] = user;
	return user;
};

BGTFacebookUser.login = function(accessToken, callback){
	BGT.Facebook.verifyUserSession(accessToken, function(data){
		if (util.isError(data)) return callback(data);
		if (BGTFacebookUser.users[data.id]) return process.nextTick(function(){
			callback(BGTFacebookUser.users[data.id]);
		});
		db.query().
			select('fbuser.fbId as id, fbuser.name, team.name as team_name, fbuser.admin, team.stats as stats, fbuser.lastupdated as lastupdated').
			from('fbuser').
			join({table:'team', type:'left', conditions:'fbuser.team_id = team.id'}).
			where('fbuser.fbId = ?', [data.id]).
			execute(function(err, rows){
				if (err) return callback(err);
				var now = new Date();
				// did we find the user in the database? good :)
				if (rows.length > 0) {
					return callback(BGTFacebookUser.addUser(new BGTFacebookUser(rows[0])));
				}

				// not in the database? get user info from the facebook graph
				BGT.Facebook.getUserInfo(data.id, function(data){
					var user = BGTFacebookUser.addUser(new BGTFacebookUser(data));
					callback(user);

					db.query().insert('fbuser',
						['fbId', 'name', 'admin', 'lastupdated'],
						[data.id, data.name, data.admin, new Date()]).execute(function(err, res){
							if (err) util.log('error caching facebook data:\n' + err.stack);
						}
					);
				});
			});
	});
};

BGTFacebookUser.prototype.setTeam = function(id, callback) {
	var me = this;
	db.query().select('id, name').from('team').where('id = ?', [id]).execute(function(err, result){
		if (err) return callback(err);
		if (result.length == 0) return callback(new Error("Team not found."));
		var team = result[0];
		me.team_name = team.name;
		db.query().update('fbuser').set({team_id:id}).where('fbId = ?', [me.id]).execute(function(err, result){
			return callback(err ? err : team);
		});
	});
};

BGTFacebookUser.prototype.setPassword = function(pass, callback) {
	return callback(new Error('changing facebook user passwords is not supported.'));
};

