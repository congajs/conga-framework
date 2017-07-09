/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// local modules
var KernelFactory = require('./kernel/factory');

/**
 * This is the main object which bootstraps the conga.js application
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = {

	kernel: {
		factory: KernelFactory ,
		kernel: require('./kernel/kernel') ,
		cache: require('./kernel/cache') ,
		cli: require('./kernel/cli') ,
		http: require('./kernel/http')
	} ,

	config: {
		config: require('./config/config') ,
		loader: require('./config/loader')
	} ,

	ioc: {
		serviceLoader: require('./ioc/service-loader') ,
		tagSorter: require('./ioc/tag-sorter')
	} ,

	Controller: require('./controller/controller'),

	/**
	 * Boot up the Kernel using the current project root path
	 * 
	 * @returns {void}
	 */
	boot: function(context, app, environment, options, cb){

		// get a kernel instance for the given context
		var kernel = KernelFactory.factory(context, app, environment, options);

		// boot the kernel
		kernel.boot(function(err){

			cb(kernel);

			// shutdown the kernel on SIGTERM
			process.on('SIGTERM',function(){
				kernel.shutdown(function(){
					process.exit(1);        
				});
			});

			// log unhandled promise rejections
			process.on('unhandledRejection', (reason, p) => {
				if (!(reason instanceof Error)) {
					reason = new Error(reason);
				}
				console.error('Unhandled Promise Rejection: ' + (reason.stack || reason));
			});
		});
	}
};