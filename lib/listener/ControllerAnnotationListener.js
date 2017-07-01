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

// third-party modules
const annotations = require('@conga/annotations');

// local modules
const TagSorter = require('../ioc/TagSorter');

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
	 * @param {Object}   event
	 * @param {Function} next
	 *
	 * @return {Void}
	 */
	onKernelCompile(event, next) {

		const container = event.container;
	 	const controllers = this.findControllers(container);
		const registry = new annotations.Registry();

		// add controller data to container
		container.setParameter('conga.controllers', controllers);

		// register annotations from tagged handlers
		this.registerAnnotationPaths(container, registry);

		// create the annotation reader
		const reader = new annotations.Reader(registry);

		container.get('logger').debug('[conga-framework] - processing controller annotations');

		// parse out all the routes and add them to the return array
		controllers.forEach((controller) => {
			container.get('logger').debug('[conga-framework] - handling controller: ' + controller.filePath);
			this.runAnnotationHandlers(container, reader, controller);
		});

		// move on
		next();
	}

	/**
	 * Register all of the annotation paths on to the annotation registry
	 * from tagged annotatiton handlers
	 *
	 * @param  {Container} container
	 * @param  {Object}    registry
	 *
	 * @return {void}
	 */
	registerAnnotationPaths(container, registry) {

		// find all the tagged handlers
		const tags = container.getTagsByName('controller.annotation.handler');

		// run each handler
		tags.forEach((tag) => {

			const handler = container.get(tag.getServiceId());

			handler.getAnnotationPaths().forEach((annotationPath) => {
				registry.registerAnnotation(annotationPath);
			});
		});

	}

	/**
	 * Run all of the registered annotation handlers on a controller
	 *
	 * @param {Container} container
	 * @param {Reader} reader
	 * @param {String} controller
	 *
	 * @return {Void}
	 */
	runAnnotationHandlers(container, reader, controller) {

		// find all the tagged handlers
		const tags = container.getTagsByName('controller.annotation.handler');

		TagSorter.sortByPriority(tags);

		// run each handler
		tags.forEach(function(tag){
			const handler = container.get(tag.getServiceId());

			container.get('logger').debug('[conga-framework] - running handler: ' + tag.getServiceId());

			handler[tag.getParameter('method')].call(handler, container, reader, controller);
		});
	}

	/**
	 * Get an array of all the controller files that exist in the
	 * registered bundles
	 *
	 * Returns:
	 * [
	 *     {
	 *         serviceId: controller.service.id,
	 *         filePath: /path/to/controller.js,
	 *         bundle: bundle-name
	 *     }
	 * ]
	 *
	 * @param {Container} container
	 *
	 * @return {Array}
	 */
	findControllers(container) {

		const bundles = container.getParameter('app.bundles');
		const controllers = [];

		let dir;
		let controllerServiceId;
		let controllerPath;

		bundles.forEach(function(bundle){

			// if (fs.existsSync(path.join(container.getParameter('kernel.bundle_path'), bundle))) {
			// 	dir = path.join(container.getParameter('kernel.bundle_path'), bundle);
			// } else if (fs.existsSync(path.join(container.getParameter('kernel.project_path'), 'node_modules', bundle))) {
			// 	dir = path.join(container.getParameter('kernel.project_path'), 'node_modules', bundle);
			// } else {
			// 	throw("can't find bundle: " + bundle);
			// }

			dir = path.join(container.get('bundle.finder').find(bundle), 'lib', 'controller');

			if (!fs.existsSync(dir)) {
				return;
			}

			fs.readdirSync(dir).filter((file) => {

				// filter only js files
				return file.substr(-3) == '.js';

			}).forEach((filename) => {

				// build the controller's service id
				controllerServiceId = 'controller.' + bundle + '.' + filename.replace('.js', '');

				// create the full path to the controller
				controllerPath = path.join(dir, filename);

				const controller = {
					serviceId: controllerServiceId,
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
