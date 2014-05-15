var util = require('util');

module.exports = function(data, callback) {
    var me = this,
        event = me.getEvent(data),
        user = me.getUser(),
        type = me.getUserType(user);
    if (user.anonymous) return;
    var query = db.query().select(['id', 'fb_post_id'])
              .from('participation')
              .where('user_type = ?', [ type ] )
              .and('user_id = ?', [ user.id ] )
              .and('event_id = ?', [ event.id ] );

    query.execute(function(error, rows){
        if (error) return callback(new Error('database error'));
        if (rows.length == 0) return callback(new Error('participation not found'));
        var participation = rows[0];

        var deleteParticipation = function(){
            db.query().delete().from('participation')
                      .where('id = ?', [participation.id])
                      .execute(function(error, result){
                          if (error) return callback(new Error('database error'));
                          callback();
                      });
        };

        if (participation.fb_post_id) {
            BGT.Facebook.deleteStory(participation.fb_post_id, function(error){
                if (error) util.log('error deleting facebook story (ignored):\n' + error.stack);
                deleteParticipation();
            });
        } else deleteParticipation();
    });
};
