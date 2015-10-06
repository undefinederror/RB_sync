module.exports = {
    init: init, 
    serialiseCountryXML: serialiseCountryXML
};

// modules
global.DOMParser = require('xmldom').DOMParser;
var jsdom = require('jsdom').jsdom().defaultView;
var $ = require('jquery')(jsdom);
var fs = require('fs-extra');
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
var chinaReg = new RegExp('/cn/', 'i'); // not used for now. using cell-id number > o < 110
var CONST = require('./const.js');

//
var xmlOpt = null;

function init(ftpArr) {
    fn.konsole('copying',ftpArr[0].conf.taskConf.xml.toSwap,'accross xml, from:',ftpArr[0].conf.taskConf.ftp.envs[0],'to:', ftpArr[0].conf.taskConf.ftp.envs[1])
    var d = q.defer(), appConf = ftpArr[0].conf.appConf;
    xmlOpt = ftpArr[0].conf.taskConf.xml;
    
    
    var filesNotFound = [], filesDone=[];
    ftpArr[0].resArr.forEach(function (o) {
        var fileFrom = fs.readFileSync(appConf.localdest + o.localpathname, CONST.FILEENC);
        var fileTo;
        try {
            fileTo = fs.readFileSync(appConf.localdest + o.localpathname.replace(appConf.ftpConf[ftpArr[0].env].localDir, appConf.ftpConf[ftpArr[1].env].localDir), CONST.FILEENC);
        } catch (e) { 
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
        fn.konsole('done ', resultpathname);
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
    var $clone = getNodes($xmlFrom)[xmlOpt.toSwap].clone();
    getNodes($xmlTo)[xmlOpt.toSwap].remove();
    $xmlTo.find('items').append($clone);
    
    return $xmlTo.get(0);
}
function cleanXml(xml) {
    var $xml = $(xml);
    var $items = $xml.find('item').clone();
    var arrItems, bool = false;
    
    if (xmlOpt.noOffline) {
        $items =$items.filter(function () { return $(this).attr('online').toLowerCase() === 'true' });
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
        isChina = $items.filter(function () {
            return !!$(this).find(selector.desktop)[0] &&
            ($(this).find('target').attr('cell-id') | 0) > 110 
        }).size()>0,
        $desk = $items.filter(function () { return !!$(this).find(selector.desktop)[0] }),
        $mob = $items.filter(function () { return !!$(this).find(selector.mobile)[0] })
    ;
    if (isChina) { 
        $mob=$desk.filter(function () { return ($(this).find('target').attr('cell-id') | 0) > 110 })
        $desk=$desk.filter(function () { return ($(this).find('target').attr('cell-id') | 0) < 110 })
    } 
    return { desktop: $desk, mobile: $mob };
}
function getCtryXML(o) {
    fn.konsole('getting country xml from:', o.env);
    return fn.P(o.ftp.get, o.ftp, o.conf.appConf.ftpConf[o.env].remoteDir + '/_repository/_resources/_xml/countries.xml', o.conf.appConf.ctryXML)
}
function serialiseCountryXML(o) {
    var d = q.defer(), dGet = q.defer();
    if (o.conf.taskConf.ftp.refreshCtryXML) {
        getCtryXML(o).then(function () {
            dGet.resolve();
        });
    } else {
        dGet.resolve();
    }
    dGet.promise.then(function () {
        fn.konsole('working out ecommerce folders based on countries.xml')
        var file = fs.readFileSync(o.conf.appConf.ctryXML, CONST.FILEENC),
            xml = $.parseXML(file),
            $ctrys = $(xml).find('country'),
            $ecomm = $ctrys.filter(function (idx, ctry) {
                return ($(ctry).attr('ecommerce').toLowerCase() === 'true' || 
                        !!$(ctry).attr('ecommerce-provider'))
                ;
            })
        ;
        
        o.conf.taskConf.ftp.ecommFolderReg = {
            ecomm: getArrFolderRegex($ecomm).concat(o.conf.appConf.ecommNotInCtryXML),
            nonecomm: getArrFolderRegex($ctrys.not($ecomm))
        }
        
        //o.conf.taskConf.ftp.ecommFolderReg.ecomm.forEach(function (item) { 
        //    console.log('ecomm', item )
        //})
        function getArrFolderRegex($coll) {
            return $.map($coll, function (ctry) {
                return new RegExp('/' + $(ctry).attr('lang').replace('-', '/') + '/', 'i');
            });
        }

        d.resolve();
    });
   
    return d.promise;
}