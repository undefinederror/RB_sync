
var conf = {
    appConf: require('./appConf.js'), 
    taskConf: require('./taskConf.js')
};
var CONST=require('./this_modules/const.js')

// modules
var q = require('q');
var _ftp = require('./this_modules/ftp.js');
var _xml = require('./this_modules/xml.js');
var fn = require('./this_modules/fn.js');

init();

function init() {
    var ftpArr = [
        _ftp(conf, conf.taskConf.ftp.envs[0]),
        _ftp(conf, conf.taskConf.ftp.envs[1])
    ];
    q.all([ftpArr[0].auth(), ftpArr[1].auth()])
    .then(function () {
        fn.konsole('authenticated ..');
        // ftps authenticated
        // remove local folders if set in conf
        return fn.checkRemoveLocalFolders();
    })
    .then(function () {
        // if search entiles filtering based on country xml enrich ftp object
        if (conf.taskConf.ftp.filterEcomm) {
            fn.konsole(conf.taskConf.ftp.filterEcomm, 'filter applied. retrieving countries info');
            return _xml.serialiseCountryXML(ftpArr[1]);
        } else {
            return q.resolve()
        }
    })
    .then(function () {
        // ok, ready to go
        fn.konsole('searching files ..');
        return q.all([ftpArr[0].searchFor(), ftpArr[1].searchFor()]);
    })
    .then(function (res) {
        // list of files found, per ftp instance
        fn.konsole('getting files ..');
        ftpArr[0].resArr = res[0];
        ftpArr[1].resArr = res[1];
        return q.all([ftpArr[0].getFromList(), ftpArr[1].getFromList()]);
    })
    .then(function (res) {
        // files downloaded locally
        fn.konsole('DONE GETTING');
        return _xml.init(ftpArr);
    })
    .then(function (fileNotFound) {
        fn.konsole('DONE SWAPPING');
        if (fileNotFound.length) {
            fn.konsole(fileNotFound.length, ' not found');
            fn.konsole(fileNotFound);
        }
    })
    .catch(fn.logErr)
    .done(function () {
        console.log(CONST.YO);
        ftpArr[0].ftp.raw.quit();
        ftpArr[1].ftp.raw.quit();
        return;
        //process.exit();
        }
    );

}