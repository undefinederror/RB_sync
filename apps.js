
var conf = {
    appConf: require('./appConf.js'), 
    taskConf: require('./taskConf.js')
};


// modules
var q = require('q');
init();


function init() {
    var ftpAcc = require('./this_modules/ftp.js')(conf, conf.appConf.ENV.ACCEPTANCE);
    var ftpSit = require('./this_modules/ftp.js')(conf, conf.appConf.ENV.SIT);
    q.all([ftpAcc, ftpSit])
    .then(function () { 
        console.log('logged');
    })
    .catch(function (err) {new Error(err) })
    .done();

}