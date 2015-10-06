var CONST = require('./this_modules/const.js');

module.exports =
{
    verbose:true,
    ftp: {
        removeLocalFolders:true,
        envs: [CONST.ENV.ACCEPTANCE, CONST.ENV.PROD],
        path: '/_repository/_resources/_xml/',
        regname: /^banners\.xml$/i,
        regdirexclude: [/^_backup/i,/^event/i, /^craft/i],
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