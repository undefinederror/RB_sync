
var conf = require('./conf.js');
var JSftp = require('jsftp');
var mkdirp = require('mkdirp');
var _ = require('lodash');
var $ = require('jquery');
var fs = require('fs');
var q = require('q');
var ftpType = {
    FILE: 0,
    DIR: 1
};


var 
	choice = '0',
    env = 'acceptance',
    ftpConf = conf.ftpConf[env],
    ftp,
    pass,// = fs.readFileSync(conf.ftpPass, 'utf8',);//[ftpConf.auth.authKey]; 
    path = withSlash('/_repository/_resources/_xml/en/US'),
    remotepath = ftpConf.remoteDir + path,
    regname=/^banners\.xml$/,
    regdirexclude = [/_backup\.menu/],
    recursivesearch=false
;

init();

function init() { 
    console.log('initing...');
    // ftp getting credentials
    P(fs.readFile, fs, conf.ftpPass, 'utf8')
    .then(function (res) {
        // creating ftp instance with credentials
        pass = JSON.parse(res)[ftpConf.authKey];
        _.extend(ftpConf.auth, pass);
        ftp = new JSftp(ftpConf.auth);
        return q.resolve();
    })
    .then(function () {
        // connecting to ftp
        console.log('connecting...');
        return P(ftp.auth, ftp, ftp.username, ftp.password);
    })
    .then(function () {
        // searching recursively for files
        console.log('connected');
        console.log('searching files...');
        return searchFor(remotepath, regname)
    })
    .then(function (arrFiles) {
        // printing out
        console.log('found ',arrFiles.length,' files matching ', regname.toString());
        arrFiles.forEach(function (o) {
            console.log(o.remotepathname);
        });
        // getting from ftp
        return getFromList(arrFiles);
    })
    .then(function(){
        // files copied locally
        console.log('files copied');
    })
    .catch(logErr)
    .done()
    ;
}

function P(fn,_this) {
    var args = [].slice.apply(arguments).slice(2),
        _this=_this||null,
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


function logErr(err) { console.log(err) }
function withSlash(name) { return (name.slice(-1)==='/'?name:name+'/')}

function searchFor(path, regEx) {
    var arrFiles = [], arrDir=[], d = q.defer();
    function searchIn(path, regEx) {
        var path = withSlash(path);
        P(ftp.ls, ftp, path)
        .then(
            function (res) {
                arrFiles=arrFiles.concat(
                    res.filter(function (o) {
                        if (o.type === ftpType.FILE && o.name.match(regEx)) {
                            o.remotedir = path;
                            o.localdir=path.replace(ftpConf.remoteDir,ftpConf.localDir)
                            o.remotepathname = o.remotedir + o.name;
                            o.localpathname = o.localdir + o.name;
                            return o;
                        }
                    })
                );
                arrDir=arrDir.concat(
                    res.filter(function (o) {
                        if (o.type=== ftpType.DIR && !nMatch(o.name, regdirexclude)) {
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
        arrPdir = _.map(arrDir, function (dir) { return P(mkdirp, null, dir) });
    
    q.all(arrPdir)
    .then(function () {
        getThis(arrFiles.shift());
    });
   
    function getThis(o) {
        console.log('getting ', o.localpathname, '...');
        P(ftp.get, ftp, o.remotepathname, conf.localdest + o.localpathname)
        .then(function () {
            if (arrFiles.length > 0) { getThis(arrFiles.shift()) }
            else { d.resolve(); }
        });
    }
    return d.promise;
}

function funk(arg1, callback) {
    setTimeout(inFunk, 500);
    function inFunk() {
        return callback(arg1, !arg1);
    }
}
function nMatch(name, arg) {
    var probe = arg;
    if (!(arg instanceof Array)) { 
        probe = [arg];
    }
    return _.map(arg, function (reg) { return !!name.match(reg) * 1 })
    .reduce(function (a, b) { return a + b });
}
