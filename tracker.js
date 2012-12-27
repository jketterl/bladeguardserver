BGTTracker = function(engine){
	this.engine = engine;
	this.purgePositions()
};

var util = require('util');

BGTTracker.prototype.purgePositions = function(){
	util.log('purging all positions');
	this.infos = {};
	this.positions = {};
};

BGTTracker.prototype.trackPosition = function(user, location, callback){
	// get a list of candidate route points from the map that the user is close to
	var candidates = this.engine.getMap().getCandidatesForLocation(location);

	// split candidates into groups that are index-wise close to each other
	var candidateGroups = this.buildCandidateGroups(candidates);

	// select one candidate per group that is closest to the users current position
	var selectedCandidates = this.selectCandidatesFromGroups(candidateGroups);

	if (!this.infos[user.uid]) this.infos[user.uid] = [];
	var trackerInfo = this.infos[user.uid];

	// update the list of plausible positions
	var position = this.updatePlausiblePositions(trackerInfo, selectedCandidates, location);

	if (!this.positions[user.uid] && position) {
		util.log(user + ' is now on track!');
	} else if (this.positions[user.uid] && !position) {
		util.log('we lost ' + user);
	}
	this.positions[user.uid] = position;

	if (callback) callback(position);
};

BGTTracker.prototype.getPosition = function(user){
	return this.positions[user.uid] || false;
};

BGTTracker.prototype.updatePlausiblePositions = function(ti, selectedCandidates, location){
	var me = this;
	// try to find prevously selected candidates that are in index range
	ti.forEach(function(position, i){
		var updated = false;
		selectedCandidates.forEach(function(candidate){
			if (!candidate.considered) {
				var map = me.engine.getMap();
				var delta = map.getIndexDelta(position.index, candidate.index);
				var distance;
				if (delta >= 0) {
					distance = map.getDistanceBetween(position.index, candidate.index);
				} else {
					distance = -1 * map.getDistanceBetween(candidate.index, position.index);
				}
				if (Math.abs(delta) <= 10) {
					updated = true;
					candidate.considered = true;
					// movement calculation is not used in candidate selection any more.
					//candidate.movements = (position.movements || 0) + delta;
					candidate.distance = (position.distance || 0) + distance;
					candidate.fixed = (position.fixed || false);
					candidate.direction = (delta != 0 ? delta : position.direction || 0);
					ti[i] = candidate;
				}
			}
		});
		if (!updated) {
			position.error = me.getLocationError(position, location);
			if (position.error > .5) {
				//util.log('purging one plausible position (no new location candidates and error too big)');
				ti.splice(i, 1);
			}
		}
	});
	// if there are unconsidered candidates, add them to the plausible list
	selectedCandidates.forEach(function(candidate){
		if (!candidate.considered) ti.push(candidate);
	});

	// iterate over the plausible positions and try to find one that has collected enough score
	var bestCandidate = false;
	ti.forEach(function(position){
		if (position.error > .2) return;
		if (ti.length > 1 && !position.fixed && (!position.distance || !(position.distance >= .2 || position.distance <= -.8))) return;
		if (!bestCandidate) {
			bestCandidate = position; 
		} else {
			if (position.distance > bestCandidate.distance) bestCandidate = position;
		}
	});
	return bestCandidate || false;
};

BGTTracker.prototype.buildCandidateGroups = function(candidates) {
	var candidateGroups = [];
	var currentGroup = [];
	var lastCandidate;
	for (var i = 0; i < candidates.length; i++) {
		if (typeof(lastCandidate) != 'undefined') {
			var delta = this.engine.getMap().getIndexDelta(lastCandidate.index, candidates[i].index);
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
};

BGTTracker.prototype.selectCandidatesFromGroups = function(candidateGroups) {
	var selectedCandidates = [];
        candidateGroups.forEach(function(group){
                var selected = null;
		group.forEach(function(candidate){
                        if (selected == null) {
                                selected = candidate;
                        } else {
                                if (candidate.distance < selected.distance) selected = candidate;
                        }
                });
		selectedCandidates.push(selected);
        });
	return selectedCandidates;
}

BGTTracker.prototype.getLocationError = function(candidate, location) {
	var point1 = candidate.location;
	var offset = typeof(candidate.direction) == 'undefined' || candidate.direction >= 0 ? 1 : -1
	var point2 = this.engine.getMap().getIndexAtOffset(candidate.index, offset);
	var idealDistance = point1.getDistanceTo(point2);
	var myDistance = point1.getDistanceTo(location) + point2.getDistanceTo(location);
	var error = myDistance - idealDistance;
	return error;
}
