module.exports = initFtp;

// modules
var JSftp = require('jsftp');
var mkdirp = require('mkdirp');
var _ = require('lodash');
var fs = require('fs');
var q = require('q');

// const
const ftpType = {
    FILE: 0,
    DIR: 1
};
var methods = {
    searchFor: searchFor,
    getFromList:getFromList
}
var ftpPass=null;
function initFtp(conf,env) {
    ftpPass = ftpPass || fs.readFileSync(conf.appConf.ftpPass, 'utf8'); // caches after first invoke
    var authKey = conf.appConf.ftpConf[env].authKey; 
    var pass = JSON.parse(ftpPass)[authKey];
    _.extend(conf.appConf.ftpConf[env].auth, pass);
    var o = {
        conf: conf,
        tfp: null,
    }
    o.ftp = new JSftp(conf.appConf.ftpConf[env].auth);
    _.extend(o, methods);
    
    // return promise with authenticated ftp
    return q.nfcall(o.ftp.auth,o.ftp.username, o.ftp.password);
}

// functions
function nMatch(name, arg) {
    var probe = arg;
    if (!(arg instanceof Array)) {
        probe = [arg];
    }
    return _.map(arg, function (reg) { return !!name.match(reg) * 1 })
    .reduce(function (a, b) { return a + b });
}
function withSlash(name) { return (name.slice(-1) === '/'?name:name + '/') }

function searchFor(path, regEx) {
    var arrFiles = [], arrDir = [], d = q.defer();
    function searchIn(path, regEx) {
        var path = withSlash(path);
        q.nfcall(this.ftp.ls,path)
        .then(
            function (res) {
                arrFiles = arrFiles.concat(
                    res.filter(function (o) {
                        if (o.type === ftpType.FILE && o.name.match(regEx)) {
                            o.remotedir = path;
                            o.localdir = path.replace(this.conf.appConf.ftpConf.remoteDir, this.conf.appConf.ftpConf.localDir)
                            o.remotepathname = o.remotedir + o.name;
                            o.localpathname = o.localdir + o.name;
                            return o;
                        }
                    })
                );
                arrDir = arrDir.concat(
                    res.filter(function (o) {
                        if (o.type === ftpType.DIR && !nMatch(o.name, regdirexclude)) {
                            o.remotepathname = path + o.name;
                            return o;
                        }
                    })
                );
                if (arrDir.length > 0 && recursivesearch) {
                    searchIn(arrDir.pop().remotepathname, regEx)
                } else {
                    d.resolve(arrFiles);
                }
            },
            logErr
        );
    }
    searchIn(path, regEx);
    return d.promise;
}
function getFromList(arrFiles) {
    var 
        d = q.defer(),
        arrDir = _.uniq(_.map(arrFiles, function (o) { return conf.localdest + o.localdir }), true),
        arrPdir = _.map(arrDir, function (dir) { return q.nfcall(mkdirp, dir) });
    
    q.all(arrPdir)
    .then(function () {
        getThis(arrFiles.shift());
    });
    
    function getThis(o) {
        console.log('getting ', o.localpathname, '...');
        q.nfcall(this.ftp.get, o.remotepathname, conf.localdest + o.localpathname)
        .then(function () {
            if (arrFiles.length > 0) { getThis(arrFiles.shift()) }
            else { d.resolve(); }
        });
    }
    return d.promise;
}