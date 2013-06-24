/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * This command starts up an application in a conga.js project
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
		command: "container:dump",
		description: "List the registered services in the application"
	},

	/**
	 * Run the command
	 * 
	 * @return {void}
	 */
	run: function(container, value, options, cb){

		container.get('logger').info('running list-services');

		var services = container.getServices();

		var names = [];

		for (var i in services){
			names.push(i);
		}

		names.sort();

		console.log('Registered services:');
		console.log('====================');

		names.forEach(function(name){
			console.log('service: ' + name);
		});

		cb();
	}
};