BGTUser = function(uid) {
	this.uid = uid;
}

BGTUser.prototype.updateLocation = function(location) {
	this.location = location;
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
                console.log('selected from group ' + i + ': ' + selected.index);
        }
}
