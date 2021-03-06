var YahooWeatherProvider = function(){
    this.cache = {};
};

var http = require('http'),
    xml2js = require('xml2js'),
    moment = require('moment'),
    codes = require('./codes-de.json');

YahooWeatherProvider.prototype.getPrognosis = function(d, c) {
    var me = this,
        now = moment(),
        limit = moment().add('d', 7);
        d = moment(d),
        ck = d.format('YYYYMMDD'),
        fromCache = me.cache[ck];

    // don't query if the event is too far in the future (7days +)
    if (d.isAfter(limit)) return c(null);

    if (fromCache && fromCache.validUntil.isAfter(now)) return c(fromCache.value);

    http.get('http://weather.yahooapis.com/forecastrss?w=676757&u=c', function(res) {
        if (res.statusCode != 200) {
            console.warn('weather provider returned status code: ' + res.statusCode);
            return c(null);
        }

        var data = '';
        res.on('data', function(chunk) { data += chunk });
        res.on('end', function() {
            try {
                xml2js.parseString(data, function(err, result) {
                    var w = null
                    result.rss.channel[0].item[0]['yweather:forecast'].forEach(function(x){
                        var props = x['$'];
                        if (moment(props.date).isSame(d, 'day')) {
                            w = props;
                            w.text = codes[w.code];
                            w.image = "/weather/icons/" + w.code + ".png";
                        }

                    });
                    if (w != null) me.cache[ck] = {
                        validUntil:moment(now).add(1, 'hours'),
                        value:w
                    };
                    c(w);
                });
            } catch (e) {
                console.warn('could not parse weather data:\n' + e + '\n' + data);
                c(null);
            }
        })
    }).on('error', function(err) {
        c(null);
    });
};

module.exports = YahooWeatherProvider;
