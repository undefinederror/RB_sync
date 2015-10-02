var ENV = {
    SIT: 'sit',
    ACCEPTANCE: 'acceptance',
    PROD: 'prod'

}


module.exports=
{
    envs:[ENV.ACCEPTANCE,ENV.SIT],
    path:'/_repository/_resources/_xml/en/',
    regname:/^banners\.xml$/i,
    regdirexclude:[/^\.resx$/],
    recursivesearch: true,
    limitEcomm: false,
    ecomm:true
}