var sys = require('sys');
var util = require('util');
var crypto = require('crypto');

BGTUser = function(uid) {
	if (typeof(uid) == 'object') for (var a in uid) {
		this[a] = uid[a];
	} else this.uid = uid;
}

BGTUser.users = []

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
        return BGTUser.addUser(new BGTUser(random));
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
        if (candidates.length == 0) {
		if (this.hasPosition()) {
			this.testLocationInRange(location);
		}
		return;
	}

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
		this.updatePosition(selectedCandidates, location);
	} else {
		this.updatePlausiblePositions(selectedCandidates);
	}
}

BGTUser.prototype.testLocationInRange = function(location) {
	var point1 = this.position.location;
	var point2 = engine.getMap().getIndex(this.position.index+1);
	var idealDistance = point1.getDistanceTo(point2);
	var myDistance = point1.getDistanceTo(location) + point2.getDistanceTo(location);
	var error = myDistance - idealDistance;
	util.log('user error is ' + error);
	// allowed error: 200m
	if (error >= .2) {
		this.resetPosition();
	}
}

BGTUser.prototype.updatePosition = function (selectedCandidates, location) {
	for (var i = 0; i < selectedCandidates.length; i++) {
		var delta = engine.getMap().getIndexDelta(this.position.index, selectedCandidates[i].index);
		if (delta >= -2 && delta < 10) {
			this.setPosition(selectedCandidates[i]);
			return;
		}
	}
	util.log('could not update position with the given candidates.')
	this.testLocationInRange(location)
}

BGTUser.prototype.updatePlausiblePositions = function(selectedCandidates) {
	// try to find prevously selected candidates that are in index range
	if (this.plausiblePositions) {
		for (var i in this.plausiblePositions) {
			var position = this.plausiblePositions[i];
			for (var k = 0; k < selectedCandidates.length; k++) {
				var candidate = selectedCandidates[k];
				if (!candidate.considered) {
					var delta = engine.getMap().getIndexDelta(position.index, candidate.index);
					util.log('delta between candidates: ' + delta);
					if (Math.abs(delta) <= 10) {
						candidate.considered = true;
						candidate.score = (position.score ? position.score : 0);
						// moving forward scores more points than moving backwards
						if (delta >= 0) {
							candidate.score += 10 * delta;
						} else {
							candidate.score += -4 * delta;
						}
						this.plausiblePositions[i] = candidate;
					}
				}
			}
		}
		// if there are unconsidered candidates, add them to the plausible list
		for (var i in selectedCandidates) {
			var candidate = selectedCandidates[i];
			if (!candidate.considered) this.plausiblePositions.push(candidate);
		}
	} else {
		this.plausiblePositions = selectedCandidates;
	}

	// iterate over the plausible positions and try to find one that has collected enough score
	for (var i in this.plausiblePositions) {
		var position = this.plausiblePositions[i];
		util.log('score is ' + position.score);
		if (position.score >= 30) {
			delete(position.score);
			this.setPosition(position);
			delete this.plausiblePositions;
			break;
		} else if (position.score <= -30) {
			util.log('purging one plausible position');
			delete(this.plausiblePositions[i]);
		}
	}
}

BGTUser.prototype.setPosition = function(position) {
	util.log('position fix for ' + this + ': ' + position.index);
	this.position = position;
}

BGTUser.prototype.hasPosition = function() {
	return typeof(this.position) != 'undefined';
}

BGTUser.prototype.resetPosition = function() {
	util.log('resetting position for ' + this);
	// convert the last known position into a plausible position to speedup re-positioning
	this.position.score = 20;
	this.plausiblePositions = [this.position];
	delete this.position;
}

BGTUser.prototype.toString = function() {
	if (this.name) return this.name;
	return 'uid ' + this.uid
}
