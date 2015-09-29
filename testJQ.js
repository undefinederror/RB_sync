global.DOMParser = require('xmldom').DOMParser;
//global.XMLSerializer = require('xmldom').XMLSerializer;
var jsdom = require('jsdom').jsdom().defaultView;
var $ = require('jquery')(jsdom);
var fs = require('fs');
var q = require('q');
var _ = require('lodash');
var filepath = {
    ENV1: 'local/rb_acceptance/_repository/_resources/_xml/en/US/banners.xml',
    ENV2: 'local/rb_dev/_repository/_resources/_xml/en/US/banners.xml',
}
var selector = {
    DEKSTOP: 'target[base-rule-id=18]',
    MOBILE: 'target[base-rule-id=266]'
}
var target = {
    DEKSTOP: 'DEKSTOP',
    MOBILE: 'MOBILE'
}
var xmlAcc = fs.readFileSync(filepath.ENV1, 'utf-8');
var xmlDev = fs.readFileSync(filepath.ENV2, 'utf-8');

init();

function init() {
        // put mobile nodes from acceptance to rbdev
        //var accNodes = getNodes($xml1);
        //var rbdevNodes = getNodes($xml2);
        
        //var final = $xml2.remove(rbdevNodes.mob).append(accNodes.mob);
        //var strXml = final.outerHTML;
        //console.log(strXMl);
    var $final = swapTargetsAccrossXml(xmlAcc, xmlDev, target.MOBILE);
    var finalXml = $final.get().toString();
    fs.writeFileSync('bannes.xml', finalXml, 'utf-8');
    console.log('done');
    
    
    
}
function swapTargetsAccrossXml(xmlFrom, xmlTo, what) {
    var $xmlTo = $($.parseXML(xmlTo));
    var $xmlFrom = $($.parseXML(xmlFrom));
    var $clone = $xmlFrom.find('item').filter(function () {
        return !!$(this).find(selector[what])[0]
    }).clone();
    $xmlTo.find('item').filter(function () {
        return !!$(this).find(selector[what])[0]
    }).remove();
    $xmlTo.find('items').append($clone);

    return $xmlTo;
}
function cleanXml(xml, opt) {
    var $xml = $($.parseXML(xml));
    if (opt.noOffline) { 
        $xml.find('item[offline=false]').remove();
    }
    if (opt.sort) {
        _.sort($xml.find('item'), function ($item) { return $item.attr('id') });
    }
    return $xml.get().toString();
}
function getNodes($xml) {
    var $items = $xml.find('item'),
        $desk = $items.filter(function () { return !!$(this).find(target.DEKSTOP)[0] }),
        $mob = $items.filter(function () { return !!$(this).find(target.MOBILE)[0] })
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


function logErr(err) { console.log(err) }