/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// built-in modules
var fs = require('fs');
var path = require('path');

/**
 * This command generates a new bundle in the current project
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
		command: "generate:bundle <name>",
		description: "Generate a new bundle in the project",
		options: {
			'foo' : ['-f, --foo [value]', 'some foo']
		},
		arguments: ['name']
	},

	/**
	 * Run the command
	 * 
	 * @return {void}
	 */
	run: function(container, args, options, cb){

		var name = args['name'];

		container.get('logger').debug('running generate:bundle');
		container.get('logger').debug('generating bundle: ' + name);

		// build path for bundle
		var bundlePath = path.join(container.getParameter('kernel.bundle_path'), name);

		// check if bundle already exists
		if (fs.existsSync(bundlePath)){
			console.error('bundle already exists: ' + bundlePath);
			process.exit();
		}

		

		cb();
	}
};