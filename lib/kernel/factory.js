/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// built-in modules
var path = require('path');

module.exports = {

	/**
	 * Build and return a kernel for the given
	 * context and environment
	 * 
	 * @param  {String} context        the context name
	 * @param  {String} environment    the environment name
	 * @param  {Object} options        hash of options
	 * @return {Kernel}
	 */
	factory: function(context, app, environment, options){

		var validContexts = ['http', 'cli'];

		if (validContexts.indexOf(context) === -1){
			console.error('Invalid kernel context: ' + context);
			process.exit();
		}

		var Kernel = require('./' + context);
		var projectPath;

		switch (context){

			case 'http':

				projectPath = path.dirname(path.join(require.main.filename, '..'));
				break;

			case 'cli':

				projectPath = process.cwd();
				break;
		}

		var kernel = new Kernel(projectPath, app, environment, options);

		return kernel;
	}
};