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
 * The CliKernel is a kernel context which starts up
 * an application in the cli context
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
var CliKernel = function(){
	Kernel.apply(this, arguments);
};

CliKernel.prototype = Object.create(Kernel.prototype);
CliKernel.prototype.constructor = CliKernel;

/**
 * The context name
 * 
 * @type {String}
 */
CliKernel.prototype.context = 'cli';

/**
 * The kernel events to fire
 * 
 * @type {Array}
 */
CliKernel.prototype.kernelEvents = ['kernel.compile', 
									'kernel.boot',
									'kernel.boot_cli', 
									'kernel.postboot'];

/**
 * Run a given command
 * 
 * @param  {Object}     program  a commander object
 * @param  {Object}     command  the command object
 * @param  {Object}     args     hash of arguments
 * @param  {Object}     options  hash of options
 * @param  {Function}   cb       the callback function
 * @return {void}
 */
CliKernel.prototype.runCommand = function(program, command, args, options, cb){
	
	// add commander program to the command
	command.program = program;

	// run the command
	command.run(this.container, args, options, cb);
};

module.exports = CliKernel;