/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// built-in modules
const path = require('path');

/**
 * A simple object loader for the conga-dependency-injection ContainerBuilder
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class ServiceLoader {

	/**
	 * Construct the service loader with root lookup paths
	 *
	 * @param {Array} paths  array of absolute paths to where bundles are located
	 */
	constructor(paths) {
		this.paths = paths;
	}

	/**
	 * Load an object and return it in the callback
	 *
	 * @param {String} lookupPath
	 */
	load(lookupPath) {

		const parts = lookupPath.split(':');

		if (parts.length > 1) {

			// try loading from the given paths
			for (let i=0, j=this.paths.length; i<j; i++) {
				const namespacePath = this.paths[i];
				try {
					//console.log(path.join(namespacePath, parts[0], 'lib', parts[1]))
					return require(path.join(namespacePath, parts[0], 'lib', parts[1]));
				} catch(err){
					//console.log(err);
					// need to do something here to do a better check to catch errors from within a module that could really be loaded
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
}
