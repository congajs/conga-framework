/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// local modules
var Kernel = require('./kernel');

/**
 * The HttpKernel is a kernel context which starts up
 * an http server
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
var HttpKernel = function(){
	Kernel.apply(this, arguments);
};

HttpKernel.prototype = Object.create(Kernel.prototype);
HttpKernel.prototype.constructor = HttpKernel;

/**
 * The context name
 * @type {String}
 */
HttpKernel.prototype.context = 'http';

/**
 * The kernel events to fire
 * @type {Array}
 */
HttpKernel.prototype.kernelEvents = ['kernel.compile', 
									 'kernel.boot', 
									 'kernel.server_boot',
									 'kernel.register_middleware', 
									 'kernel.postboot'];

module.exports = HttpKernel;