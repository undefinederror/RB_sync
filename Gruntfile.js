module.exports = function(grunt){
	'use strict';
	
	var _= require('lodash');
	//var when =  require('when');
	var Q = require('q');
	var JSftp = require('jsftp');
	
	grunt.initConfig({
		localdest:'local',
		ftpPass:'.ftppass',
		get: {
			0:'sit',
			1:'acceptance',
			2:'prod'
		},
		//ftpConf:null,
		ftpConf:{
			sit:{
				auth: {
					host: '176.56.131.198',
					port: 21,
					authKey: 'rb_dev',
					debugMode:true
				}
			}
		}
	});
	
	grunt.registerTask('log','yo',function(){
		var file=grunt.file.readJSON(grunt.config('log.filename'));
		file.otherProp="dynamic";
		grunt.file.write(grunt.config('log.filename'),JSON.stringify(file));
		grunt.log.writeln('DONE!');
	});
	grunt.registerTask('rm','remove locally stored files',function(){
		grunt.file.delete(grunt.config('localdest'));
		grunt.file.mkdir(grunt.config('localdest'));
	});
	grunt.registerTask('get','get files from remote',function(){
		var done=this.async();
		var
			//done = this.async(),
			choice='0',
			env=grunt.config(this.name)[choice],
			conf=grunt.config('ftpConf')[env],
			pass=grunt.file.readJSON(grunt.config('ftpPass'))[conf.auth.authKey]
		;
		_.extend(conf.auth,pass);
		var ftp= new JSftp(conf.auth);
		
		//ftp.on('jsftp_debug', function(eventType, data) {
		//	//console.log('DEBUG: ', eventType);
		//	//console.log(JSON.stringify(data, null, 2));
		//});
		function auth(){
			var d=Q.defer();
			console.log('connecting ...');
			ftp.auth(ftp.username,ftp.password,function(err,res){
				if (err) {
					d.reject(new Error(err));
				}else{
					d.resolve(res);
				}
			});
			return d.promise;
		}
		//	//,function(err,res){
		//	//	grunt.log.writeln('connecting to '+ ftp.host+ '...\r');
		//	//	if(err){
		//	//	grunt.log.writeln(err);
		//	//	done();
		//	//	}else{
		//	//	grunt.log.writeln('connected. Let\'s go on\r');
		//	//	list();
		//	//}
		//}
		
		function list(){
			var d=Q.defer();
			console.log('getting list ...');
			ftp.ls("/ray-ban.com/rbdev/Views/StoreLocator",function(err,res){
				if (err) {
					d.reject(new Error(err));
				}else{
					d.resolve(res);
				}
			});
			return d.promise;
		}
		
		
		//grunt.log.writeln(JSON.stringify(conf));
		//auth()
		//.then(list)
		//.then(function(){
		//	console.log('err ' + err);
		//	console.log('res ' + res);
		//});
		
		//function wait3(){
		//	var c=0;
		//	function x(){
		//		if (c>8) {
		//			return c;
		//		}else{
		//			setTimeout(x,500);
		//		}
		//	}
		//	return x;
		//}
		auth()
			.fail(function(err){console.log(err);done()})
			.then(list)
				.then(function(res){
					console.log(res);
				});
		//.then(function(){console.log('DONE!')})
		;
		
	});
	
	
	
	
	
	
}