/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// local modules
const Kernel = require('./Kernel');

/**
 * The HttpKernel is a kernel context which starts up
 * an http server
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class HttpKernel extends Kernel {

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

		/**
		 * The context name
		 * @type {String}
		 */
		this.context = 'http';

		/**
		 * The kernel events to fire
		 * @type {Array}
		 */
		this.kernelEvents = [
			'kernel.compile',
			'kernel.compile_controllers',
			'kernel.boot',
			'kernel.server_boot',
			'kernel.register_middleware',
			'kernel.postboot'
		];
	}
}
