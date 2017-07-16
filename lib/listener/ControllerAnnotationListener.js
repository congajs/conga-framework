/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// built-in modules
const fs = require('fs');
const path = require('path');

/**
 * The ControllerAnnotationListener goes through all of the
 * registered application bundles, finds all of the controllers,
 * and then runs all of the tagged controller annotation handlers
 * on each controller.
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class ControllerAnnotationListener {

	/**
	 * Parse out all of the routing information from
	 * the annotations found in controllers
	 *
	 * @param  {Object}   event
	 * @param  {Function} next
	 * @return {void}
	 */
	onKernelCompile(event, next) {

		event.container.get('logger').debug('[conga-framework] - processing controller annotations');

		const compiler = event.container.get('conga.controller.compiler');
		const controllers = this.findControllers(event.container);

		controllers.forEach((controller) => {
			compiler.compile(controller.bundle, controller.filePath);
		});

		next();
	}

	/**
	 * Get an array of all the controller files that exist in the
	 * registered bundles
	 *
	 * Returns:
	 * [
	 *     {
	 *         filePath: /path/to/controller.js,
	 *         bundle: bundle-name
	 *     }
	 * ]
	 *
	 * @param  {Container} container
	 * @return {Array}
	 */
	findControllers(container) {

		const bundles = container.getParameter('app.bundles');
		const controllers = [];

		bundles.forEach((bundle) => {

			const dir = path.join(container.get('bundle.finder').find(bundle), 'lib', 'controller');

			if (!fs.existsSync(dir)) {
				return;
			}

			fs.readdirSync(dir).filter((file) => {

				// filter only js files
				return file.substr(-3) == '.js';

			}).forEach((filename) => {

				// create the full path to the controller
				const controllerPath = path.join(dir, filename);

				const controller = {
					filePath: controllerPath,
					bundle: bundle
				};

				// add path to result
				controllers.push(controller);
			});
		});

		return controllers;
	}
}
