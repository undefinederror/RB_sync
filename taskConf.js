var CONST = require('./this_modules/const.js');

module.exports =
{
    ftp: {
        envs: [CONST.ENV.ACCEPTANCE, CONST.ENV.SIT],
        path: '/_repository/_resources/_xml/',
        regname: /^banners\.xml$/i,
        regdirexclude: [/^_backup$/i],
        recursivesearch: true,
        filterEcomm: 'ecomm', // 'ecomm' || 'nonecomm' || a falsy value,
        refreshCtryXML: false
    },
    xml: {
        toSwap:CONST.TARGET.MOBILE,
        noOffline: true,
        sort: true,
        beautify: true,
    }
}