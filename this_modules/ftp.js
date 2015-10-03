module.exports = initFtp;

// modules
var JSftp = require('jsftp');
var mkdirp = require('mkdirp');
var _ = require('lodash');
var fs = require('fs');
var q = require('q');
var fn = require('./fn.js');

// const
var CONST = require('./const.js');

var methods = {
    searchFor: searchFor,
    getFromList: getFromList,
    auth:auth
}
var ftpPass = null;

function initFtp(conf,env) {
    ftpPass = ftpPass || fs.readFileSync(conf.appConf.ftpPass, CONST.FILEENC); // caches after first invoke
    var authKey = conf.appConf.ftpConf[env].authKey; 
    var pass = JSON.parse(ftpPass)[authKey];
    _.extend(conf.appConf.ftpConf[env].auth, pass);
    var o = {
        env: env,
        conf: conf,
        ftp: new JSftp(conf.appConf.ftpConf[env].auth),
        resArr:[]
    }
    _.extend(o, methods);
    
    return o;
    // return object which wraps ftp object
}

// functions

function searchFor() {
    var _this=this, arrFiles = [], arrDir = [], d = q.defer();
    function searchIn(path) {
        var path = fn.withSlash(path);
        fn.P(_this.ftp.ls, _this.ftp, path)
        .then(
            function (res) {
                arrFiles = arrFiles.concat(
                    res.filter(function (o) {
                        if (o.type === CONST.FTPTYPE.FILE && o.name.match(_this.conf.taskConf.ftp.regname)) {
                            o.remotedir = path;
                            o.localdir = path.replace(
                                _this.conf.appConf.ftpConf[_this.env].remoteDir, 
                                _this.conf.appConf.ftpConf[_this.env].localDir
                            );
                            o.remotepathname = o.remotedir + o.name;
                            o.localpathname = o.localdir + o.name;
                            return o;
                        }
                    })
                );
                arrDir = arrDir.concat(
                    res.filter(function (o) {
                        if (o.type === CONST.FTPTYPE.DIR && !fn.nMatch(o.name, _this.conf.taskConf.ftp.regdirexclude)) {
                            o.remotepathname = path + o.name;
                            return o;
                        }
                    })
                );
                if (arrDir.length > 0 && _this.conf.taskConf.ftp.recursivesearch) {
                    searchIn(arrDir.pop().remotepathname)
                } else {
                    if (_this.conf.taskConf.ftp.filterEcomm) {
                        arrFiles = arrFiles.filter(function (o) {
                            return fn.nMatch(o.remotedir, _this.conf.taskConf.ftp.ecommFolderReg[_this.conf.taskConf.tfp.filterEcomm]);
                        })
                    }
                    d.resolve(_.map(arrFiles, function (o) {
                        return _.pick(o, ['name','remotedir', 'localdir', 'remotepathname', 'localpathname']);
                    }));
                }
            }
        )
        .catch(logErr)
        .done();
    }
    searchIn(this.conf.appConf.ftpConf[this.env].remoteDir + this.conf.taskConf.ftp.path);
    return d.promise;
}
function getFromList() {
    var 
        _this = this,
        arrFiles = this.resArr.slice(0),
        d = q.defer(),
        arrDir = _.uniq(_.map(arrFiles, function (o) { return _this.conf.appConf.localdest + o.localdir }), true),
        arrPdir = _.map(arrDir, function (dir) { return fn.P(mkdirp, null, dir) })
        ;
    
    q.all(arrPdir)
    .then(function () {
        getThis(arrFiles.shift());
    });
    
    function getThis(o) {
        console.log('getting ', o.localpathname, '...');
        fn.P(_this.ftp.get, _this.ftp, o.remotepathname, _this.conf.appConf.localdest + o.localpathname)
        .then(function () {
            if (arrFiles.length > 0) { getThis(arrFiles.shift()) }
            else { d.resolve(); }
        });
    }
    return d.promise;
}
function auth(){ 
    return fn.P(this.ftp.auth, this.ftp, this.ftp.username, this.ftp.password);
}