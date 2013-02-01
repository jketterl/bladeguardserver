var util = require('util');
var crypto = require('crypto');

BGTUser = function(uid) {
	if (typeof(uid) == 'object') for (var a in uid) {
		this[a] = uid[a];
	} else this.uid = uid;
	var hash = crypto.createHash('md5').update('random:' + Math.random()*1000000).digest('hex');
	this.getHash = function(){
		return hash;
	}
	// this line turns on stats tracking for anonymous users.
	if (typeof(this.stats) == 'undefined') this.stats = true;
}

var EventEmitter = require('events').EventEmitter;
BGTUser.prototype = new EventEmitter;

BGTUser.users = []

BGTUser.login = function(user, pass, callback) {
	var me = this;
	var hash = crypto.createHash('md5').update(pass).digest('hex');
	db.query().
		select('users.id as uid, users.name, team.name as team_name, users.admin, team.stats as stats').
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
			if (BGTUser.hasUser(rows[0].uid)) {
				callback(null, BGTUser.getUser(rows[0].uid));
			} else {
				callback(null, BGTUser.addUser(new BGTUser(rows[0])));
			}
		});
}

BGTUser.getAnonymousUser = function() {
        do {
                random = 9000 + Math.floor(Math.random() * 1000);
        } while (BGTUser.hasUser(random));
	var user = new BGTUser(random);
	user.anonymous = true;
        return BGTUser.addUser(user);
}

BGTUser.getOlivierUser = function() {
	var user = this.getAnonymousUser();
	user.name = 'OUser #' + user.uid;
	user.foreignServer = true;
	return user;
};

BGTUser.getFacebookUser = function(data){
	var user = new BGTFacebookUser(data);
	return BGTUser.addUser(user);
}

BGTUser.hasUser = function(uid) {
        return typeof(BGTUser.users[uid]) != 'undefined';
}

BGTUser.addUser = function(user) {
        BGTUser.users[user.uid] = user;
	return user;
}

BGTUser.getUser = function(uid) {
        return BGTUser.users[uid];
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
	db.query().select('name').from('team').where('id = ?', [id]).execute(function(err, result){
		if (err) return callback(err);
		if (result.length == 0) return callback(new Error("Team not found."));
		me.team_name = result[0].name;
		db.query().update('users').set({team_id:id}).where('id = ?', [me.uid]).execute(function(err, result){
			return callback(err ? err : true);
		});
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
	//'users.id as uid, users.name, team.name as team_name, users.admin, team.stats as stats'
	BGTFacebookUser.super_.call(this, {
		uid:data.id,
		name:data.name
	});
};

util.inherits(BGTFacebookUser, BGTUser);
