module.exports = init;

// modules
global.DOMParser = require('xmldom').DOMParser;
var jsdom = require('jsdom').jsdom().defaultView;
var $ = require('jquery')(jsdom);
var fs = require('fs');
var q = require('q');
var mkdirp = require('mkdirp');
var _ = require('lodash');
var beautify = require('js-beautify');


// const
var selector = {
    desktop: 'target[base-rule-id=18]',
    mobile: 'target[base-rule-id=266]'
}
var CONST = require('./const.js');

//
var xmlOpt = null;

function init(ftpArr) {
    // put [what] nodes from [from] to [to]
    var d = q.defer();
    xmlOpt = ftpArr[0].conf.taskConf.xml;
    
    var filesNotFound = [], filesDone=[];
    ftpArr[0].resArr.forEach(function (o) {
        var fileFrom = fs.readFileSync(ftpArr[0].conf.appConf.localdest + o.localpathname, CONST.FILEENC);
        var fileTo = fs.readFileSync(ftpArr[0].conf.appConf.localdest + o.localpathname.replace(ftpArr[0].conf.appConf.ftpConf[ftpArr[0].env].localDir, ftpArr[0].conf.appConf.ftpConf[ftpArr[1].env].localDir), CONST.FILEENC); // fix with right path on other ftp
        if (!fileTo) {
            filesNotFound.push(o);
            checkResolve();
            return;
        }
        var resultdir = ftpArr[0].conf.appConf.resultdest + o.localdir.replace(ftpArr[0].conf.appConf.ftpConf[ftpArr[0].env].localDir, '');
        var resultpathname = resultdir + o.name;
        mkdirp.sync(resultdir);
        callDoFile(fileFrom, fileTo, resultpathname);
        
    });
    function callDoFile(fileFrom, fileTo, resultpathname) {
        doFile(fileFrom, fileTo, resultpathname);
        filesDone.push(resultpathname);
        checkResolve();
    };
  
    function doFile(from, to, resultpathname) { 
        var swappedXml = swapTargetsAccrossXml($.parseXML(from), $.parseXML(to));
        swappedXml = cleanXml(swappedXml);
        fs.writeFileSync(resultpathname, swappedXml.toString(), CONST.FILEENC);
        console.log('done ', resultpathname);
    }
    
    function checkResolve() { 
        if (filesNotFound.length + filesDone.length === ftpArr[0].resArr.length) { 
            d.resolve(filesNotFound);
        }
    }
    return d.promise;
}

function swapTargetsAccrossXml(xmlFrom, xmlTo) {
    var $xmlTo = $(xmlTo);
    var $xmlFrom = $(xmlFrom);
    var $clone = $xmlFrom.find('item').filter(function () {
        return !!$(this).find(selector[xmlOpt.toSwap])[0]
    }).clone();
    $xmlTo.find('item').filter(function () {
        return !!$(this).find(selector[xmlOpt.toSwap])[0]
    }).remove();
    $xmlTo.find('items').append($clone);
    
    return $xmlTo.get(0);
}
function cleanXml(xml) {
    var $xml = $(xml);
    var $items = $xml.find('item').clone();
    var arrItems, bool = false;
    
    if (xmlOpt.noOffline) {
        $items.filter('[offline=false]').remove();
        bool = true;
    }
    if (xmlOpt.sort) {
        arrItems = _.sortBy($items, function (item) { return $(item).find('target').eq(0).attr('cell-id') | 0 });
        arrItems = _.sortBy(arrItems, function (item) { return $(item).find('target').eq(0).attr('base-rule-id') | 0 });
        bool = true;
    }
    if (bool) {
        $xml.find('items')
        .text('')
        .children().remove()
        .end().append($(arrItems));
    }
    if (xmlOpt.beautify) {
        $xml = $($.parseXML(beautify.html($xml.get().toString())));
    }
    return $xml.get(0);
}
function getNodes($xml) {
    var $items = $xml.find('item'),
        $desk = $items.filter(function () { return !!$(this).find(selector.DEKSTOP)[0] }),
        $mob = $items.filter(function () { return !!$(this).find(selector.MOBILE)[0] })
        ;
    return { desk: $desk, mob: $mob };
}
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
