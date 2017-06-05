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
	 * Construct the service loader with a BundleFinder
	 *
	 * @param {BundleFinder} finder
	 */
	constructor(finder) {
		this.finder = finder;
	}

	/**
	 * Load an object and return it in the callback
	 *
	 * @param {String} lookupPath
	 */
	load(lookupPath) {

		const parts = lookupPath.split(':');

		if (parts.length > 1) {

			try {

				const p = path.join(this.finder.find(parts[0]), 'lib', parts[1]);
				return require(p);

			} catch (err) {
				console.log(err);
				// need to do something here to do a better check to catch errors from within a module that could really be loaded
				if (err.code !== 'MODULE_NOT_FOUND'){
					throw(err);
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
