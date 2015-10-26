var CONST = require('./lib/const.js');

module.exports =
{
    verbose:true,
    ftp: {
        removeLocalFolders:true,
        envs: [CONST.ENV.ACCEPTANCE, CONST.ENV.PROD],
        path: '/_repository/_resources/_xml/',
        regname: /^(banners|featurelist)\.xml$/i,
        regdirexclude: [/^_/,/^event/i, /^craft/i],
        recursivesearch: true,
        filterEcomm: 'nonecomm', // 'ecomm' || 'nonecomm' || a falsy value,
        refreshCtryXML: true
    },
    xml: {
        toSwap:CONST.TARGET.MOBILE,
        noOffline: true,
        sort: true,
        beautify: true,
    }
}