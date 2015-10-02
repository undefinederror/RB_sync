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
    getFromList: getFromList,
    auth:auth
}
var ftpPass=null;
function initFtp(conf,env) {
    ftpPass = ftpPass || fs.readFileSync(conf.appConf.ftpPass, 'utf8'); // caches after first invoke
    var authKey = conf.appConf.ftpConf[env].authKey; 
    var pass = JSON.parse(ftpPass)[authKey];
    _.extend(conf.appConf.ftpConf[env].auth, pass);
    var o = {
        env: env,
        conf: conf,
        ftp: new JSftp(conf.appConf.ftpConf[env].auth)
    }
    _.extend(o, methods);
    
    return o;
    // return promise with authenticated ftp
    //return P(o.ftp.auth, o.ftp, o.ftp.username, o.ftp.password)
   
    // should be equivalent to this below, but this below doesn't work
    //return q.nbind(o.ftp.username, o.ftp)(o.ftp.username, o.ftp.password)
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
function logErr(err) { console.log(err) }
function withSlash(name) { return (name.slice(-1) === '/'?name:name + '/') }
function P(fn, _this) {
    var args = [].slice.apply(arguments).slice(2),
        _this = _this || null,
        d = q.defer(),
        callback = function (err, res) {
            if (err) { d.reject(new Error(err)) }
            else { d.resolve(res) }
        }
    ;
    args.push(callback);
    fn.apply(_this, args);
    return d.promise;
}
function searchFor() {
    var _this=this, arrFiles = [], arrDir = [], d = q.defer();
    function searchIn(path) {
        var path = withSlash(path);
        P(_this.ftp.ls, _this.ftp, path)
        .then(
            function (res) {
                arrFiles = arrFiles.concat(
                    res.filter(function (o) {
                        if (o.type === ftpType.FILE && o.name.match(_this.conf.taskConf.regname)) {
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
                        if (o.type === ftpType.DIR && !nMatch(o.name, _this.conf.taskConf.regdirexclude)) {
                            o.remotepathname = path + o.name;
                            return o;
                        }
                    })
                );
                if (arrDir.length > 0 && _this.conf.taskConf.recursivesearch) {
                    searchIn(arrDir.pop().remotepathname)
                } else {
                    d.resolve(_.map(arrFiles, function (o) {
                        return _.pick(o, ['name','remotedir', 'localdir', 'remotepathname', 'localpathname']);
                    }));
                }
            }
        )
        .catch(logErr)
        .done();
    }
    searchIn(this.conf.appConf.ftpConf[this.env].remoteDir + this.conf.taskConf.path);
    return d.promise;
}
function getFromList(arrFiles) {
    var 
        _this=this,
        d = q.defer(),
        arrDir = _.uniq(_.map(arrFiles, function (o) { return _this.conf.appConf.localdest + o.localdir }), true),
        arrPdir = _.map(arrDir, function (dir) { return P(mkdirp, null, dir) })
        ;
    
    q.all(arrPdir)
    .then(function () {
        getThis(arrFiles.shift());
    });
    
    function getThis(o) {
        console.log('getting ', o.localpathname, '...');
        P(_this.ftp.get, _this.ftp, o.remotepathname, _this.conf.appConf.localdest + o.localpathname)
        .then(function () {
            if (arrFiles.length > 0) { getThis(arrFiles.shift()) }
            else { d.resolve(); }
        });
    }
    return d.promise;
}
function auth(){ 
    return P(this.ftp.auth, this.ftp, this.ftp.username, this.ftp.password);
}