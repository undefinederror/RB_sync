module.exports = {
    init: init, 
    serialiseCountryXML: serialiseCountryXML
};

// modules
global.DOMParser = require('xmldom').DOMParser;
var jsdom = require('jsdom').jsdom().defaultView;
var $ = require('jquery')(jsdom);
var fs = require('fs');
var q = require('q');
var mkdirp = require('mkdirp');
var _ = require('lodash');
var beautify = require('js-beautify');
var fn = require('./fn.js');

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
    var d = q.defer(), appConf = ftpArr[0].conf.appConf;
    xmlOpt = ftpArr[0].conf.taskConf.xml;
    
    
    var filesNotFound = [], filesDone=[];
    ftpArr[0].resArr.forEach(function (o) {
        var fileFrom = fs.readFileSync(appConf.localdest + o.localpathname, CONST.FILEENC);
        var fileTo = fs.readFileSync(appConf.localdest + o.localpathname.replace(appConf.ftpConf[ftpArr[0].env].localDir, appConf.ftpConf[ftpArr[1].env].localDir), CONST.FILEENC);
        if (!fileTo) {
            filesNotFound.push(o);
            checkResolve();
            return;
        }
        var resultdir = appConf.resultdest + o.localdir.replace(appConf.ftpConf[ftpArr[0].env].localDir, '');
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
function getCtryXML(o) {
    var d = q.defer();
    fn.P(o.ftp.get, o.ftp, o.conf.appConf.ftpConf[o.env].remoteDir + '/_repository/_resources/_xml/countries.xml', o.conf.appConf.countryXML)
    .then(function () { 
        d.resolve();
    });
    return d.promise;
}
function serialiseCountryXML(o) {
    var d = q.defer(), dGet = q.defer();
    if (o.conf.taskConf.ftp.refreshCtryXML) {
        getCtryXML(o).then(function () { dGet.resolve(); })
    } else {
        dGet.resolve();
    }
    dGet.then(function () {
        var file = fs.readFileSync(o.conf.appConf.ctryXML),
            xml = $.parseXML(file),
            $ctry = $(xml).find('country'),
            $ecomm = $ctry.filter(function (idx, ctry) {
                return ($(ctry).attr('ecommerce') && $(ctry).attr('ecommerce').toString().toLowerCase() === 'true') || 
                        $(ctry).is('[ecommerce-provider]')
                ;
            })
            ;
        
        o.conf.taskConf.ftp.ecommFolderReg = {
            ecomm: getArrFolderRegex($ecomm),
            nonecomm: $ctry.not($ecomm)
        }
        
        function getArrFolderRegex($coll) {
            return $coll.map(function (idx, ctry) {
                return new RegExp('/' + $(ctry).attr('lang').replace('-', '/') + '/', 'i');
            });
        }
    });
   
    return d.promise;
}
