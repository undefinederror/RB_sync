var CONST = require('./this_modules/const.js');

module.exports =
{
    ftp: {
        envs: [CONST.ENV.ACCEPTANCE, CONST.ENV.SIT],
        path: '/_repository/_resources/_xml/en/US',
        regname: /^featurelist\.xml$/i,
        regdirexclude: [/^\.resx$/],
        recursivesearch: false,
        limitEcomm: false,
        ecomm: true,
        refreshCtryXML:false
    },
    xml: {
        toSwap:CONST.TARGET.MOBILE,
        noOffline: true,
        sort: true,
        beautify: true,
    }
}