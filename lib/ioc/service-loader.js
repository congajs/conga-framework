/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// built-in modules
var path = require('path');

/**
 * A simple object loader for the conga-dependency-injection ContainerBuilder
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
var ServiceLoader = function(paths){
	this.paths = paths;
};

ServiceLoader.prototype = {

	/**
	 * The lookup paths
	 *
	 * @var {Array}
	 */
	paths: null,

	/**
	 * Load an object and return it in the callback
	 *
	 * @param {String} lookupPath
	 */
	load: function(lookupPath){

		var parts = lookupPath.split(':');

		if (parts.length > 1){
			//var subPath = path.join(parts[0], 'lib', parts[1]);

			// try loading from the given paths
			for (var i=0, j=this.paths.length; i<j; i++){
				var namespacePath = this.paths[i];
				try {
					return require(path.join(namespacePath, parts[0], 'lib', parts[1]));
				} catch(err){
					if (err.code !== 'MODULE_NOT_FOUND'){
						throw(err);
					}
				}
			}
		}

		// try a native module
		try {
			return require(lookupPath);
		} catch(err){
			console.log(err.stack);
			throw("Failed to load: " + lookupPath);
		}
	}
};

module.exports = ServiceLoader;