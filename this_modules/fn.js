var q = require('q');
var _ = require('lodash');

module.exports =
{
    nMatch: nMatch,
    logErr: logErr,
    withSlash: withSlash,
    P: P
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