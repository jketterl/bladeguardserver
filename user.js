var sys = require('sys');
var util = require('util');
var crypto = require('crypto');

BGTUser = function(uid) {
	if (typeof(uid) == 'object') for (var a in uid) {
		this[a] = uid[a];
	} else this.uid = uid;
}

BGTUser.login = function(user, pass, callback) {
	var me = this;
	var hash = crypto.createHash('md5').update(pass).digest('hex');
	db.query().
		select('id as uid, name').
		from('users').
		where('name = ? and pass = ?', [user, hash]).
		execute(function(err, rows, cols) {
			if (err) {
				return callback(err);
			}
			if (rows.length == 0) {
				return callback(new Error('user or password incorrect'));
			}
			if (engine.hasUser(rows[0].uid)) {
				callback(null, engine.getUser(rows[0].uid));
			} else {
				var user = new BGTUser(rows[0]);
				engine.addUser(user);
				callback(null, user);
			}
		});
}

BGTUser.prototype.updateLocation = function(location) {
	if (this.location) this.lastLocation = location;
	this.location = location;
	
	try {
		this.trackPosition(location);
	} catch (e) {
		sys.puts(e); sys.puts(e.stack);
	}
}

BGTUser.prototype.trackPosition = function(location) {
	// get a list of candidate route points from the map that the user is close to
        var candidates = engine.getMap().getCandidatesForLocation(location);
        if (candidates.length == 0) return;

        // split candidates into groups that are index-wise close to each other
        var candidateGroups = [];
        var currentGroup = [];
        var lastCandidate;
        for (var i = 0; i < candidates.length; i++) {
                if (typeof(lastCandidate) != 'undefined') {
                        var delta = map.getIndexDelta(lastCandidate.index, candidates[i].index);
                        if (Math.abs(delta) >= 10) {
                                if (currentGroup.length > 0) {
                                        candidateGroups.push(currentGroup);
                                        currentGroup = [];
                                }
                        }
                }
                currentGroup.push(candidates[i]);
                lastCandidate = candidates[i];
        }
        if (currentGroup.length > 0) candidateGroups.push(currentGroup);

	// select one candidate per group that is closest to the users current position
	var selectedCandidates = [];
        for (var i = 0; i < candidateGroups.length; i++) {
                var group = candidateGroups[i];
                var selected = null;
                for (var k = 0; k < group.length; k++) {
                        var candidate = group[k];
                        if (selected == null) {
                                selected = candidate;
                        } else {
                                if (candidate.distance < selected.distance) selected = candidate;
                        }
                }
		selectedCandidates.push(selected);
        }

	if (this.hasPosition()) {
		this.updatePosition(selectedCandidates);
	} else {
		this.updatePlausiblePositions(selectedCandidates);
	}
}

BGTUser.prototype.updatePosition = function (selectedCandidates) {
	for (var i = 0; i < selectedCandidates.length; i++) {
		var delta = engine.getMap().getIndexDelta(this.position.index, selectedCandidates[i].index);
		if (delta >= 0 && delta < 10) {
			this.setPosition(selectedCandidates[i]);
			return;
		}
	}
	this.resetPosition();
}

BGTUser.prototype.updatePlausiblePositions = function(selectedCandidates) {
	if (this.plausiblePositions) for (var i in this.plausiblePositions) {
		var position = this.plausiblePositions[i];
		for (var k = 0; k < selectedCandidates.length; k++) {
			var candidate = selectedCandidates[k];
			var delta = engine.getMap().getIndexDelta(position.index, candidate.index);
			util.log('delta between candidates: ' + delta);
			if (Math.abs(delta) <= 10) {
				candidate.score = (position.score ? position.score : 0) + 10 * delta;
				this.plausiblePositions[i] = candidate;
			}
		}
	} else {
		this.plausiblePositions = selectedCandidates;
	}

	for (var i in this.plausiblePositions) {
		var position = this.plausiblePositions[i];
		util.log('score is ' + position.score);
		if (position.score >= 30) {
			delete(position.score);
			this.setPosition(position);
			delete this.plausiblePositions;
			break;
		} else if (position.score <= -30) {
			util.log('purging one plausible positions');
			delete(this.plausiblePositions[i]);
		}
	}
}

BGTUser.prototype.setPosition = function(position) {
	util.log('position fix for uid ' + this.uid + ': ' + position.index);
	this.position = position;
}

BGTUser.prototype.hasPosition = function() {
	return typeof(this.position) != 'undefined';
}

BGTUser.prototype.resetPosition = function() {
	util.log('resetting position for uid ' + this.uid);
	delete this.position;
}

BGTUser.prototype.toString = function() {
	if (this.name) return this.name;
	return 'uid ' + this.uid
}
