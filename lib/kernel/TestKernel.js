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

// local modules
const Kernel = require('./HttpKernel');

/**
 * The TestKernel is a Kernel specifically for testing which overrides
 * the path to find this bundle (conga-framework)
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class TestKernel extends Kernel {

	/**
	 * Construct the kernel with project/environment/etc. settings
	 *
	 * @param  {String} projectRootPath  absolute path to project root
     * @param  {String} app              the app name
     * @param  {String} environment      the environment name
     * @param  {Object} options          hash of override options
	 */
	constructor(projectRootPath, app, environment, options) {

		super(projectRootPath, app, environment, options);

		// /**
		//  * The context name
		//  * @type {String}
		//  */
		// this.context = 'http';
        //
		// /**
		//  * The kernel events to fire
		//  * @type {Array}
		//  */
		// this.kernelEvents = [
		// 	'kernel.compile',
		// 	'kernel.boot',
		// 	'kernel.boot_cli',
		// 	'kernel.postboot'
		// ];
	}

    /**
	 * Build and return an array of service lookup paths for this project
	 *
	 * @param {Object} config
	 * @returns {Array}
	 */
	findProjectPaths(config) {

		const paths = [];

		paths.push(path.join(this.projectRootPath, 'src'));
		paths.push(path.join(__dirname, '..', '..', '..'));
        paths.push(path.join(process.env.PWD, 'node_modules'));
        paths.push(path.join(__dirname));

		return paths;
	}
}
