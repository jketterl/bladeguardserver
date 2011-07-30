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
		sys.puts(e.stack);
	}
}

BGTUser.prototype.buildCandidateGroups = function(candidates) {
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
	return candidateGroups;
}

BGTUser.prototype.selectCandidatesFromGroups = function(candidateGroups) {
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
	return selectedCandidates;
}

BGTUser.prototype.trackPosition = function(location) {
	// get a list of candidate route points from the map that the user is close to
        var candidates = engine.getMap().getCandidatesForLocation(location);

        // split candidates into groups that are index-wise close to each other
	var candidateGroups = this.buildCandidateGroups(candidates);

	// select one candidate per group that is closest to the users current position
	var selectedCandidates = this.selectCandidatesFromGroups(candidateGroups);

	// update the list of plausible positions
	this.updatePlausiblePositions(selectedCandidates, location);
}

BGTUser.prototype.getLocationError = function(candidate, location) {
	var point1 = candidate.location;
	var offset = typeof(candidate.direction) == 'undefined' || candidate.direction >= 0 ? 1 : -1
	var point2 = engine.getMap().getIndex(candidate.index + offset);
	var idealDistance = point1.getDistanceTo(point2);
	var myDistance = point1.getDistanceTo(location) + point2.getDistanceTo(location);
	var error = myDistance - idealDistance;
	return error;
}

BGTUser.prototype.updatePlausiblePositions = function(selectedCandidates, location) {
	// try to find prevously selected candidates that are in index range
	if (this.plausiblePositions) {
		for (var i in this.plausiblePositions) {
			var position = this.plausiblePositions[i];
			var updated = false;
			for (var k = 0; k < selectedCandidates.length; k++) {
				var candidate = selectedCandidates[k];
				if (!candidate.considered) {
					var delta = engine.getMap().getIndexDelta(position.index, candidate.index);
					if (Math.abs(delta) <= 10) {
						updated = true;
						candidate.considered = true;
						candidate.movements = (position.movements ? position.movements : 0) + delta;
						candidate.fixed = (position.fixed ? position.fixed : false);
						candidate.direction = (delta != 0 ? delta : position.direction || 0);
						this.plausiblePositions[i] = candidate;
					}
				}
			}
			if (!updated) {
				position.error = this.getLocationError(position, location);
				if (position.error > .5) {
					util.log('purging one plausible position');
					this.plausiblePositions.splice(i, 1);
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
	var bestCandidate = false;
	for (var i in this.plausiblePositions) {
		var position = this.plausiblePositions[i];
		if (position.error > .2) continue;
		if (this.plausiblePositions.length > 1 && !position.fixed && (!position.movements || !(position.movements >= 2 || position.movements <= -5))) continue;
		if (!bestCandidate) {
			bestCandidate = position; 
		} else {
			if (position.movements > bestCandidate.movements) bestCandidate = position;
		}
	}
	if (bestCandidate) this.setPosition(bestCandidate); else this.resetPosition();
}

BGTUser.prototype.setPosition = function(position) {
	util.log('position fix for ' + this + ': ' + position.index);
	this.position = position;
	position.fixed = true;
}

BGTUser.prototype.hasPosition = function() {
	return typeof(this.position) != 'undefined';
}

BGTUser.prototype.resetPosition = function() {
	if (!this.hasPosition()) return;
	util.log('resetting position for ' + this);
	this.position.fixed = false;
	delete this.position;
}

BGTUser.prototype.toString = function() {
	if (this.name) return this.name;
	return 'uid ' + this.uid
}
