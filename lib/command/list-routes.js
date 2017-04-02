/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * This command lists of the routes in an app
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = {

	/**
	 * Set up configuration for this command
	 * 
	 * @var {Object}
	 */
	config: {
		command: "routes:list",
		description: "List the registered routes in the application"
	},

	/**
	 * Run the command
	 * 
	 * @return {void}
	 */
	run: function(container, value, options, cb){

		container.get('logger').info('running routes:list');

		var routes = container.getParameter('conga.routes');

		console.log('Registered routes:');
		console.log('====================');

		routes.forEach(function(route){
			console.log(route.name + ' - ' + route.path + ' - ' + route.method);
		});

		cb();
	}
};