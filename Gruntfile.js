module.exports = function(grunt){
	'use strict';
	
	var _= require('lodash');
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
		var
			done = this.async(),
			choice='0',
			env=grunt.config(this.name)[choice],
			conf=grunt.config('ftpConf')[env],
			pass=grunt.file.readJSON(grunt.config('ftpPass'))[conf.auth.authKey]
		;
		_.extend(conf.auth,pass);
		//grunt.log.writeln(JSftp);
		var ftp= new JSftp(conf.auth);
		ftp.on('jsftp_debug', function(eventType, data) {
			//console.log('DEBUG: ', eventType);
			//console.log(JSON.stringify(data, null, 2));
		});
		ftp.auth(ftp.username,ftp.password,function(err,res){
			grunt.log.writeln('connecting to '+ ftp.host+ '...\r');
			if(err){
			grunt.log.writeln(err);
			done();
			}else{
			grunt.log.writeln('connected. Let\'s go on\r');
			list();
			
			
			}
		});
		function list(){
			ftp.ls("/ray-ban.com/rbdev/Views/StoreLocator", function(err, res) {
				res.forEach(function(file) {
					console.log(file.name);
				});
				console.log(res.length + ' files');
				done();
			});
		}
		
		
		//grunt.log.writeln(JSON.stringify(conf));
		
	});
	
	
	
	
	
	
}