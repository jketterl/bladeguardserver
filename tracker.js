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

	if (!this.infos[user.uid]) this.infos[user.uid] = {};
	var trackerInfo = this.infos[user.uid];

	// update the list of plausible positions
	var position = this.updatePlausiblePositions(trackerInfo, selectedCandidates, location);

	this.positions[user.uid] = position;

	if (callback) callback(position);
};

BGTTracker.prototype.getPosition = function(user){
	return this.positions[user.uid] || false;
};

BGTTracker.prototype.updatePlausiblePositions = function(ti, selectedCandidates, location){
	var me = this;
	// try to find prevously selected candidates that are in index range
	if (ti.plausiblePositions) {
		ti.plausiblePositions.forEach(function(position, i){
			var updated = false;
			selectedCandidates.forEach(function(candidate){
				if (!candidate.considered) {
					var delta = me.engine.getMap().getIndexDelta(position.index, candidate.index);
					if (Math.abs(delta) <= 10) {
						updated = true;
						candidate.considered = true;
						candidate.movements = (position.movements ? position.movements : 0) + delta;
						candidate.fixed = (position.fixed ? position.fixed : false);
						candidate.direction = (delta != 0 ? delta : position.direction || 0);
						ti.plausiblePositions[i] = candidate;
					}
				}
			});
			if (!updated) {
				position.error = me.getLocationError(position, location);
				if (position.error > .5) {
					util.log('purging one plausible position (no new location candidates and error too big)');
					ti.plausiblePositions.splice(i, 1);
				}
			}
		});
		// if there are unconsidered candidates, add them to the plausible list
		for (var i in selectedCandidates) {
			var candidate = selectedCandidates[i];
			if (!candidate.considered) ti.plausiblePositions.push(candidate);
		}
	} else {
		ti.plausiblePositions = selectedCandidates;
	}

	// iterate over the plausible positions and try to find one that has collected enough score
	var bestCandidate = false;
	for (var i in ti.plausiblePositions) {
		var position = ti.plausiblePositions[i];
		if (position.error > .2) continue;
		if (ti.plausiblePositions.length > 1 && !position.fixed && (!position.movements || !(position.movements >= 2 || position.movements <= -5))) continue;
		if (!bestCandidate) {
			bestCandidate = position; 
		} else {
			if (position.movements > bestCandidate.movements) bestCandidate = position;
		}
	}
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

BGTTracker.prototype.getLocationError = function(candidate, location) {
	var point1 = candidate.location;
	var offset = typeof(candidate.direction) == 'undefined' || candidate.direction >= 0 ? 1 : -1
	var point2 = this.engine.getMap().getIndexAtOffset(candidate.index, offset);
	var idealDistance = point1.getDistanceTo(point2);
	var myDistance = point1.getDistanceTo(location) + point2.getDistanceTo(location);
	var error = myDistance - idealDistance;
	return error;
}
