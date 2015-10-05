module.exports =
{
    localdest: 'local',
    resultdest: 'result',
    ctryXML: 'countries.xml',
    ecommNotInCtryXML: [
        new RegExp('/ja/', 'i'), 
        new RegExp('/pl/', 'i')
    ],
    ftpPass: '.ftppass',
    ftpConf: {
        sit: {
            authKey: 'rb_dev',
            remoteDir: '/ray-ban.com/rbdev',
            localDir: '/rb_dev',
            auth: {
                host: '176.56.131.198',
                port: 21
            }
        },
        acceptance: {
            authKey: 'rb_acceptance',
            remoteDir: '/ray-ban.com/gpstaging',
            localDir: '/rb_acceptance',
            auth: {
                host: '176.56.131.188',
                port: 21,
            }
        },
        prod: {
            authKey: 'rb_production',
            remoteDir: '/ray-ban.com/gpwww',
            localDir: '/rb_prod',
            auth: {
                host: '176.56.131.195',
                port: 21,
            }
        }
    }
}