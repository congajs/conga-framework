/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// native modules
var path = require('path');
var url = require('url');

// third-party modules
var _ = require('lodash');

// local modules
//var RestController = require('../rest-controller');
var Websocket = require('../websocket');
var WebsocketRest = require('../websocket-rest');

/**
 * The WebsocketAnnotationHandler finds all websocket annotations within the registered
 * controllers and configures the websocket routes
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 */
var WebsocketAnnotationHandler = function(){};

WebsocketAnnotationHandler.prototype = {
	
	/**
	 * Get the annotation paths that should be parsed
	 *
	 * @return {Array}
	 */
	getAnnotationPaths: function(){
		return [
			path.join(__dirname, '..', 'websocket'),
			path.join(__dirname, '..', 'websocket-rest')
		];
	},

	/**
	 * Handle all of the websocket annotations on a controller
	 * 
	 * @param {Container} container
	 * @param {Reader} reader
	 * @param {Object} controller
	 * @returns {Array}
	 */
	handleAnnotations: function(container, reader, controller){
		
		// grab the REST methods config from container
		this.restMethods = container.getParameter('rest.methods');

		// parse the routes from the controller
		var routes = this.parseRoutesFromFile(container, reader, controller);

		if (routes.length > 0){
			
			// make sure that container has routes array
			if (!container.hasParameter('conga.websocket.routes')){
				container.setParameter('conga.websocket.routes', []);
			}

			// store routes for socket.io to use later on
			container.setParameter('conga.websocket.routes', container.getParameter('conga.websocket.routes').concat(routes));			
		}
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

		// find constructor annotations
		constructorAnnotations.forEach(function(annotation){

			// @WebsocketRest annotation
			if (annotation instanceof WebsocketRest){
				
				var prefix = annotation.prefix;

				// // build all of the REST method routes
				// this.restMethods.forEach(function(restMethod){

				// 	var name = prefix + '.' + restMethod.name;

				// 	routes.push({
				// 		name: name,
				// 		controller: controller.serviceId,
				// 		action: restMethod.action
				// 	});
				// });
			}

		}, this);

		// find method annotations
		methodAnnotations.forEach(function(annotation){

			// @Websocket annotation
			if (annotation instanceof Websocket){

				// create the route configuration
				routes.push({
					name: annotation.name,
					controller: controller.serviceId,
					action: annotation.target
				}); 
			}
		});

		return routes;
	}
};

module.exports = WebsocketAnnotationHandler;