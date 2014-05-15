var util = require('util');

module.exports = function(data, callback) {
    var me = this,
        event = me.getEvent(data),
        user = me.getUser(),
        type = me.getUserType(user);
    if (user.anonymous) return callback();
    var query = db.query().select(['id'])
              .from('participation')
              .where('user_type = ?', [ type ] )
              .and('user_id = ?', [ user.id ] )
              .and('event_id = ?', [ event.id ] );

    query.execute(function(error, rows, columns){
        if (error) return callback(new Error('database error'));
        if (rows.length > 0) return callback(new Error('participation already registered'));

        var query = db.query().insert('participation', ['user_id', 'user_type', 'event_id'], [user.id, type, event.id])
        query.execute(function(error, result){
            if (error) return callback(new Error('database error'));
            var participationId = result.id;

            if (!(user instanceof BGTFacebookUser)) return callback();

            util.log(user.name + ' is partipating in event ' + event.title + ' - posting to her / his facebook');
            BGT.Facebook.postStory(user, event, function(storyId){
                if (util.isError(storyId)) {
                    util.log('error posting to facebook:\n' + storyId.stack);
                    return callback(new Error('could not publish post'));
                }
                db.query().update('participation')
                        .set({"fb_post_id":storyId})
                        .where('id = ?', [ participationId ])
                        .execute(function(error, result){
                            if (error) return callback(new Error('database error'));
                            callback();
                        });
                util.log('story id: ' + storyId);
            });
        });
    });
};
