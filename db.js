module.exports = new (require('db-mysql').Database)({
        hostname:'localhost',
        database:'bladeguardtracker',
        user:'bgt',
        password:'bgtiscool'
});
