global.DOMParser = require('xmldom').DOMParser;
//global.XMLSerializer = require('xmldom').XMLSerializer;
var jsdom = require('jsdom').jsdom().defaultView;
var $ = require('jquery')(jsdom);
var fs = require('fs');
var q = require('q');
var _ = require('lodash');
var beautify = require('js-beautify');
var filepath = {
    ENV1: 'local/rb_acceptance/_repository/_resources/_xml/en/US/banners.xml',
    ENV2: 'local/rb_dev/_repository/_resources/_xml/en/US/banners.xml',
}
var selector = {
    desktop: 'target[base-rule-id=18]',
    mobile: 'target[base-rule-id=266]'
}
var target = {
    DEKSTOP: 'desktop',
    MOBILE: 'mobile'
}
var xmlAcc = fs.readFileSync(filepath.ENV1, 'utf-8');
var xmlDev = fs.readFileSync(filepath.ENV2, 'utf-8');

opt = {
    noOffline:true,
    sort: true,
    beautify:true
}

init();

function init() {
        // put mobile nodes from acceptance to rbdev
        //var accNodes = getNodes($xml1);
        //var rbdevNodes = getNodes($xml2);
        
        //var final = $xml2.remove(rbdevNodes.mob).append(accNodes.mob);
        //var strXml = final.outerHTML;
        //console.log(strXMl);
    var swappedXml= swapTargetsAccrossXml($.parseXML(xmlAcc), $.parseXML(xmlDev), target.MOBILE);
    swappedXml = cleanXml(swappedXml, opt);
    fs.writeFileSync('bannes.xml', swappedXml.toString(), 'utf-8');
    console.log('done');
    
    
    
}
function swapTargetsAccrossXml(xmlFrom, xmlTo, what) {
    var $xmlTo = $(xmlTo);
    var $xmlFrom = $(xmlFrom);
    var $clone = $xmlFrom.find('item').filter(function () {
        return !!$(this).find(selector[what])[0]
    }).clone();
    $xmlTo.find('item').filter(function () {
        return !!$(this).find(selector[what])[0]
    }).remove();
    $xmlTo.find('items').append($clone);

    return $xmlTo.get(0);
}
function cleanXml(xml, opt) {
    var $xml = $(xml);
    var $items = $xml.find('item').clone();
    var arrItems, bool = false;

    if (opt.noOffline) {
        $items.filter('[offline=false]').remove();
        bool = true;
    }
    if (opt.sort) {
        arrItems=_.sortBy($items, function (item) { return $(item).find('target').eq(0).attr('cell-id')|0 });
        arrItems= _.sortBy(arrItems, function (item) { return $(item).find('target').eq(0).attr('base-rule-id') | 0 });
        bool = true;
    }
    if (bool) {
        $xml.find('items')
        .text('')
        .children().remove()
        .end().append($(arrItems));
    }
    if (opt.beautify) { 
        $xml =$($.parseXML(beautify.html($xml.get().toString())));
    }
    return $xml.get(0);
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