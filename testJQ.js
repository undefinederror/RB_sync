var jsdom = require('jsdom').jsdom().defaultView;
var $ = require('jquery')(jsdom);
var fs = require('fs');
var q = require('q');
var filepath = {
    ENV1: 'local/rb_acceptance/_repository/_resources/_xml/en/US/banners.xml',
    ENV2: 'local/rb_dev/_repository/_resources/_xml/en/US/banners.xml',
}
var target = {
    DEKSTOP: 'target[base-rule-id=18]',
    MOBILE: 'target[base-rule-id=266]'
}

init();

function init() {
    var xml1, xml2, $xml1, $xml2;
    //get xml
    P(fs.readFile, fs, filepath.ENV1, 'utf-8')
    .then(function (r) {
        $xml1 = $(r);
        return P(fs.readFile, fs, filepath.ENV2, 'utf-8');
    })
    .then(function (r) {
        $xml2 = $(r);
        return q.resolve();
    })
    .then(function (r) {
        goOn();
    });
    
    function goOn() {
        // put mobile nodes from acceptance to rbdev
        var accNodes = getNodes($xml1);
        var rbdevNodes = getNodes($xml2);
        
        var final = $xml2.remove(rbdevNodes.mob).append(accNodes.mob);
        var strXml = final.outerHTML;
        console.log(strXMl);
    
    
    
    }
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