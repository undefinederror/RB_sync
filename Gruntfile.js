module.exports = function(grunt){
	'use strict';
	grunt.initConfig({
		log: {
			foo: [1, 2, 3],
			bar: 'hello world',
			baz: false,
			filename:'tmp/test.js'
		}
	});
	
	grunt.registerTask('log','yo',function(){
		var file=grunt.file.readJSON(grunt.config('log.filename'));
		file.otherProp="dynamic";
		grunt.file.write(grunt.config('log.filename'),JSON.stringify(file));
		grunt.log.writeln('DONE!');
	});
	
	
	
	
	
	
	
	
}