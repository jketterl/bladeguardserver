var express = require('express');

var BGTController = function(app){
    app.use('/static', express.static(__dirname + '/ws'));

    app.get('/', this.index);
    app.get('/event.html', this.eventList);
    app.get('/download.html', this.download);
    app.get('/event/:id.html', this.event);
    app.get('/admin', this.admin);
    app.get('/impressum.html', this.impressum);
}

BGTController.prototype.index = function(req, res){
    var events = BGTEvent.getAll();
    res.render('index', { nextEvent: events[0] });
};

BGTController.prototype.eventList = function(req, res){
    res.render('event/list', {
        events:BGTEvent.getAll(true),
        year:parseInt(req.query.year) || new Date().getFullYear()
    });
};

BGTController.prototype.download = function(req, res){ res.render('download'); };

BGTController.prototype.event = function(req, res){
    res.render('event/event', {
        event:BGTEvent.get(req.params.id),
        url:'https://' + req.headers.host + '/event/' + req.params.id + '.html'
    });
};

BGTController.prototype.admin = function(req, res){ res.render('admin/index'); };

BGTController.prototype.impressum = function(req, res) { res.render('impressum'); };

module.exports = BGTController;
