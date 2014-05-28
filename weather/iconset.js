var mappings, path;

var IconSet = function(p) {
    path = p;
    mappings = require(path + '/mapping.json');
    for (var a in mappings) {
        var file = mappings[a];
        fs.stat(path + '/' + file, function(err, stats) {
            if (err) return util.log('error loading weather icon file: ' + file + '\n' + err.stack);
        });
    }
};

var fs = require('fs'),
    util = require('util');

IconSet.prototype.registerWith = function(app, prefix){
    app.get('/weather/icons/:id.png', function(req, res){
        var id = req.params.id;
        if (typeof(mappings[id]) == 'undefined') return res.send('not found', 404);
        res.setHeader('Content-Type', 'image/png');
        var stream = fs.createReadStream(path + '/' + mappings[id]);
        stream.pipe(res);
    });
};

module.exports = IconSet;
