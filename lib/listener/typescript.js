/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// built-in modules
var fs = require('fs-extra');
var path = require('path');

// third-party modules
var tsapi = require("typescript.api");

/**
 * The ControllerAnnotationListener goes through all of the 
 * registered application bundles, finds all of the controllers, 
 * and then runs all of the tagged controller annotation handlers 
 * on each controller.
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 */
var TypeScriptListener = function(){};

TypeScriptListener.prototype = {

	/**
	 * Parse out all of the routing information from
	 * the annotations found in controllers
	 * 
	 * @param container
	 */
	onKernelCompile: function(event, next) {

		return next();
		//console.log('IN TYPESCRIPT LISTENER');

		this.container = event.container;

		var fileMap = this.findAllTypeScriptPaths();

		//console.log(fileMap);

		this.compileFiles(fileMap);

		next();
	},

	compileFiles: function(fileMap) {

		var sourceUnits = [];

		console.log(fileMap);


		for (var i in fileMap) {
			console.log('===== ' + i);
			var content = fs.readFileSync(i, 'utf8');
			//console.log(content);
			sourceUnits.push(tsapi.create(i, content));
		}


		tsapi.compile(sourceUnits, function(compiled) {
		 
		    for (var n in compiled) {
		    
		    	console.log('++++ ' + compiled[n].path);

		        fs.writeFileSync(fileMap[compiled[n].path.replace('.js', '.ts')], compiled[n].content);
		    }
		});
	},

	/**
	 * Find all the typescript file paths from the bundles
	 * 
	 * @return {Array<String>}
	 */
	findAllTypeScriptPaths: function() {

		var fileMap = {};
		var paths = [];

		var bundles = this.container.getParameter('bundle.paths');

		console.log(bundles);

		for (var bundle in bundles) {
			console.log(bundle);
			paths = this.recFindByExt(path.join(bundles[bundle], 'lib'), 'ts');

			//console.log(paths);

			for (var i=0; i<paths.length; i++) {

				var sub = paths[i].slice(paths[i].indexOf(bundle), paths[i].length);
				var parts = path.parse(sub);

				// make sure that compile directory exists
				var compileDir = path.join(this.container.getParameter('kernel.compiled_path'), parts.dir);

				fs.ensureDir(compileDir);

				//console.log(compileDir);

				fileMap[paths[i]] = path.join(compileDir, parts.name + '.js');
			}
		}

		return fileMap;
	},

	recFindByExt: function(base,ext,files,result) {
	    
	    var files = files || fs.readdirSync(base) 
	    var result = result || [] 
	    var that = this;

	    files.forEach( 
	        function (file) {
	            var newbase = path.join(base,file)
	            if ( fs.statSync(newbase).isDirectory() )
	            {
	                result = that.recFindByExt(newbase,ext,fs.readdirSync(newbase),result)
	            }
	            else
	            {
	                if ( file.substr(-1*(ext.length+1)) == '.' + ext )
	                {
	                    result.push(newbase)
	                } 
	            }
	        }
	    )
	    return result
	}
};

module.exports = TypeScriptListener;