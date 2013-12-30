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

// third-party modules
var annotations = require('conga-annotations');

/**
 * The ControllerAnnotationListener goes through all of the 
 * registered application bundles, finds all of the controllers, 
 * and then runs all of the tagged controller annotation handlers 
 * on each controller.
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 */
var ControllerAnnotationListener = function(){};

ControllerAnnotationListener.prototype = {

	/**
	 * Parse out all of the routing information from
	 * the annotations found in controllers
	 * 
	 * @param container
	 */
	onKernelCompile: function(event, next){

		var container = event.container;
		var controllers = this.findControllers(container);
		var registry = new annotations.Registry();

		// add controller data to container
		container.setParameter('conga.controllers', controllers);

		// register annotations from tagged handlers
		this.registerAnnotationPaths(container, registry);

		// create the annotation reader
		var reader = new annotations.Reader(registry);
	
		container.get('logger').debug('Running controller annotations');

		// parse out all the routes and add them to the return array
		controllers.forEach(function(controller){
			this.runAnnotationHandlers(container, reader, controller);
		}, this);

		container.get('logger').debug('Ran controller annotation handlers');

		// move on
		next();
	},

	/**
	 * Register all of the annotation paths on to the annotation registry
	 * from tagged annotation handlers
	 * 
	 * @param  {Object} registry
	 * @return {void}
	 */
	registerAnnotationPaths: function(container, registry){

		// find all the tagged handlers
		var tags = container.getTagsByName('controller.annotation.handler');
		
		// run each handler
		tags.forEach(function(tag){
			var handler = container.get(tag.getServiceId());

			handler.getAnnotationPaths().forEach(function(annotationPath){
				registry.registerAnnotation(annotationPath);
			});
		});
	},
	
	/**
	 * Run all of the registered annotation handlers on a controller
	 * 
	 * @param {Container} container
	 * @param {Reader} reader
	 * @param {String} controllerId
	 * @param {String} controllerPath
	 */
	runAnnotationHandlers: function(container, reader, controller){
		
		// find all the tagged handlers
		var tags = container.getTagsByName('controller.annotation.handler');
		
		// run each handler
		tags.forEach(function(tag){
			var handler = container.get(tag.getServiceId());
			handler[tag.getParameter('method')].call(handler, container, reader, controller);
		});
	},
		
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
	 * @returns {Array}
	 */
	findControllers: function(container){
		
		var bundles = container.getParameter('app.bundles');
		var dir;
		var controllers = [];

		bundles.forEach(function(bundle){
	
			if (fs.existsSync(path.join(container.getParameter('kernel.bundle_path'), bundle))){
				dir = path.join(container.getParameter('kernel.bundle_path'), bundle);
			} else if (fs.existsSync(path.join(container.getParameter('kernel.project_path'), 'node_modules', bundle))){
				dir = path.join(container.getParameter('kernel.project_path'), 'node_modules', bundle);
			} else {
				throw("can't find bundle: " + bundle);
			}
			
			dir = path.join(dir, 'lib', 'controller');
			
			if (!fs.existsSync(dir)){
				return;
			}
			
			files = fs.readdirSync(dir);

			files.forEach(function(filename){

				// build the controller's service id
				controllerServiceId = 'controller.' + bundle + '.' + filename.replace('.js', '');

				// create the full path to the controller
				controllerPath = path.join(dir, filename);
				
				var controller = {
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
};

module.exports = ControllerAnnotationListener;