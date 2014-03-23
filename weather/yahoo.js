var YahooWeatherProvider = function(){}

var http = require('http'),
    xml2js = require('xml2js'),
    moment = require('moment'),
    codes = require('./codes-de.json');

YahooWeatherProvider.prototype.getPrognosis = function(d, c) {
    http.get('http://weather.yahooapis.com/forecastrss?w=676757&u=c', function(res) {
        if (res.statusCode != 200) {
            console.warn('weather provider returned status code: ' + res.statusCode);
            return c(null);
        }

        var data = '';
        res.on('data', function(chunk) { data += chunk });
        res.on('end', function() {
            xml2js.parseString(data, function(err, result) {
                var w = null
                result.rss.channel[0].item[0]['yweather:forecast'].forEach(function(x){
                    var props = x['$'];
                    if (moment(props.date).isSame(d, 'day')) {
                        w = props;
                        w.text = codes[w.code];
                        w.image = "http://l.yimg.com/us.yimg.com/i/us/we/52/" + w.code + ".gif";
                    }
                });
                c(w);
            });
        })
    }).on('error', function(err) {
        c(null)
    });
};

module.exports = YahooWeatherProvider;
