var q = require('q');
var _ = require('lodash');
var fs = require('fs-extra');
var taskConf = require('../taskConf.js');
var appConf = require('../appConf.js');

module.exports =
{
    nMatch: nMatch,
    logErr: logErr,
    withSlash: withSlash,
    P: P,
    konsole: konsole,
    checkRemoveLocalFolders:checkRemoveLocalFolders
};


function nMatch(name, arg) {
    var probe = arg;
    if (!arg.map) {
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
function konsole(){ if (taskConf.verbose) console.log.apply(console, arguments); }
function checkRemoveLocalFolders() {
    if (taskConf.ftp.removeLocalFolders) {
        return q.all([
            P(fs.emptyDir, fs, appConf.localdest),
            P(fs.emptyDir, fs, appConf.resultdest),
        ]);
    }
    else { 
        return q.resolve();
    }
}
