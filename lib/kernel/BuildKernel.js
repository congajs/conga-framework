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
 * The BuildKernel is a kernel context which starts up a kernel in the build
 * context and runs any attached build processes
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class BuildKernel extends Kernel {

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
		this.context = 'build';

		/**
		 * The kernel events to fire
		 * @type {Array}
		 */
		this.kernelEvents = [
			'kernel.compile',
			'kernel.boot',
			'kernel.postboot'
		];
	}

	/**
	 * Run the build process
	 *
	 * @param  {Object}     args     hash of arguments
	 * @param  {Object}     options  hash of options
	 * @param  {Function}   cb       the callback function
	 * @return {void}
	 */
	build(args, options, cb) {
        this.container.get('conga.builder').build(cb);
	}
}
