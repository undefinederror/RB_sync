
var conf = {
    appConf: require('./appConf.js'), 
    taskConf: require('./taskConf.js')
};


// modules
var q = require('q');
var _ftp = require('./this_modules/ftp.js');
init();


function init() {
    var ftpArr = [
        _ftp(conf, conf.appConf.ENV.ACCEPTANCE),
        _ftp(conf, conf.appConf.ENV.SIT)
    ];
    q.all([ftpArr[0].auth(), ftpArr[1].auth()])
    .then(function () {
        // ftps authenticated, ready to use
        return q.all([ftpArr[0].searchFor(), ftpArr[1].searchFor()]);
    })
    .then(function (res) {
        // list of files found, per ftp instance
        tfpArr[0].resArr = res[0];
        tfpArr[1].resArr = res[1];
        return q.all([ftpArr[0].getFromList(res[0]), ftpArr[1].getFromList(res[1])]);
    })
    .then(function (res) {
        // files downloaded locally
        console.log('DONE!')
    })
    .catch(function (err) {new Error(err) })
    .done();

}