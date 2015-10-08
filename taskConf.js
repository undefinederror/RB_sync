var CONST = require('./this_modules/const.js');

module.exports =
{
    verbose:true,
    ftp: {
        removeLocalFolders:true,
        envs: [CONST.ENV.PROD,CONST.ENV.ACCEPTANCE],
        path: '/_repository/_resources/_xml/',
        regname: /^featurelist\.xml$/i,
        regdirexclude: [/^_backup/i,/^event/i, /^craft/i],
        recursivesearch: true,
        filterEcomm: 'nonecomm', // 'ecomm' || 'nonecomm' || a falsy value,
        refreshCtryXML: false
    },
    xml: {
        toSwap:CONST.TARGET.MOBILE,
        noOffline: true,
        sort: true,
        beautify: true,
    }
}