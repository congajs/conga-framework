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
var url = require('url');

// third-party modules
var _ = require('lodash');

// local modules

/**
 * The RoutingAnnotationHandler finds all routing annotations within the registered
 * controllers and configures routing information, etc. within the application
 * DIC container
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 */
var RoutingAnnotationHandler = function(){};

RoutingAnnotationHandler.prototype = {
	
	/**
	 * Get the annotation paths that should be parsed
	 *
	 * @return {Array}
	 */
	getAnnotationPaths: function(){
		return [
			path.join(__dirname, '..', 'route')
		];
	},

	/**
	 * Handle all of the routing annotations on a controller
	 * 
	 * @param {Container} container
	 * @param {Reader} reader
	 * @param {Object} controller
	 * @returns {void}
	 */
	handleAnnotations: function(container, reader, controller){
		
		// grab the REST methods config from container
		this.restMethods = container.getParameter('rest.methods');

		// parse the routes from the controller
		var routes = this.parseRoutesFromFile(container, reader, controller);

		// make sure that container has routes array
		if (!container.hasParameter('conga.routes')){
			container.setParameter('conga.routes', []);
		}

		// store routes for express to use later on
		container.setParameter('conga.routes', container.getParameter('conga.routes').concat(routes));
	},
		
	/**
	 * Find the annotations in a controller and build all the routes based
	 * on the annotation data
	 * 
	 * @param {Container} container
	 * @param {Reader} reader
	 * @param {Object} controller
	 * @returns {Array}
	 */
	parseRoutesFromFile: function(container, reader, controller){

		// set up return array
		var routes = [];

		// parse the annotations
		reader.parse(controller.filePath);

		// get the annotations
		var constructorAnnotations = reader.getConstructorAnnotations();
		var methodAnnotations = reader.getMethodAnnotations();
		var prefix = '/';
		
		// find constructor annotations
		constructorAnnotations.forEach(function(annotation){

			// @Route annotation
			if (annotation.annotation === 'Route'){
				prefix = annotation.value;
			}
		});

		// store prefix on controller data
		controller.prefix = prefix;

		// find method annotations
		methodAnnotations.forEach(function(annotation){

			// @Route annotation
			if (annotation.annotation === 'Route'){
				
				var methods = annotation.methods;

				if (typeof methods === 'undefined' || methods === null){
					methods = ['GET'];
				}

				// loop through route methods [GET,POST,etc...]
				for (var x in methods){
					
					var path = (prefix + annotation.value)

					if (path !== '//'){
						path = path.replace('//', '/').replace(/\/+$/, '') // hack to clean up weird concats
					} else {
						path = '/';
					}

					// create the route configuration
					routes.push({
						name: annotation.name,
						controller: controller.serviceId,
						action: annotation.target,
						method: methods[x],
						path: path,
						filePath: controller.filePath
					}); 
				}
			}
		});

		// build the controller prototype
		var C = require(controller.filePath); 
		var _controller = new C();
		if (typeof _controller.setContainer === 'function') {

			_controller.setContainer(container);

		} else {
			_controller.container = container;
		}

		// add controller to container
		container.set(controller.serviceId, _controller);
		
		return routes;
	}
};

module.exports = RoutingAnnotationHandler;