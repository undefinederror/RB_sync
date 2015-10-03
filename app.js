﻿
var conf = {
    appConf: require('./appConf.js'), 
    taskConf: require('./taskConf.js')
};
var CONST=require('./this_modules/const.js')

// modules
var q = require('q');
var _ftp = require('./this_modules/ftp.js');
var _xml = require('./this_modules/xml.js');

init();

function init() {
    var ftpArr = [
        _ftp(conf, CONST.ENV.ACCEPTANCE),
        _ftp(conf, CONST.ENV.SIT)
    ];
    q.all([ftpArr[0].auth(), ftpArr[1].auth()])
    .then(function () {
        // ftps authenticated, ready to use
        // if search entiles filtering based on country xml enrich ftp object
        if (conf.taskConf.ftp.filterEcomm) { 
            _xml.serialiseCountryXML(ftpArr[1]);
        }
        return q.all([ftpArr[0].searchFor(), ftpArr[1].searchFor()]);
    })
    .then(function (res) {
        // list of files found, per ftp instance
        ftpArr[0].resArr = res[0];
        ftpArr[1].resArr = res[1];
        return q.all([ftpArr[0].getFromList(), ftpArr[1].getFromList()]);
    })
    .then(function (res) {
        // files downloaded locally
        console.log('DONE GETTING')
        return _xml.init(ftpArr);
    })
    .then(function (fileNotFound) {
        console.log('DONE SWAPPING')
        if (fileNotFound.length) {
            console.log(fileNotFound.length, ' not found');
            console.log(fileNotFound);
        }
    })
    .catch(function (err) {new Error(err) })
    .done(function () {
        console.log(CONST.YO);
        ftpArr[0].ftp.raw.quit();
        ftpArr[1].ftp.raw.quit();
    });

}