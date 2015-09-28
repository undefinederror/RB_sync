module.exports =
{
    localdest: 'local',
    ftpPass: '.ftppass',
    get: {
        0: 'sit',
        1: 'acceptance',
        2: 'prod'
    },
    //ftpConf:null,
    ftpConf: {
        sit: {
            authKey: 'rb_dev',
            remoteDir: '/ray-ban.com/rbdev',
            localDir: '/rb_dev',
            auth: {
                host: '176.56.131.198',
                port: 21
            }
        }
    }
}