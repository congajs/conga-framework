/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// built-in modules
var url = require('url');

// third-party modules
var _ = require('lodash');

// local modules
var Jsonp = require('../jsonp');
var RestController = require('../rest-controller');
var RestModifyCriteria = require('../rest-modify-criteria');
var Route = require('../route');

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
	 * Handle all of the routing annotations on a controller
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
		
		// set the default controller type to use
		var controllerType = 'NORMAL';
		
		// parse the annotations
		reader.parse(controller.filePath);

		// get the annotations
		var constructorAnnotations = reader.getConstructorAnnotations();
		var methodAnnotations = reader.getMethodAnnotations();
		var prefix = '/';
		
		var restModifyCriteriaMethods = [];
		var restAnnotation;
		var restAdapter;
		var restModel;
		var wrappedPagination;

		// find constructor annotations
		constructorAnnotations.forEach(function(annotation){

			// @RestController annotation
			if (annotation instanceof RestController){

				controllerType = 'REST';
				restAdapter = annotation.adapter;
				restModel = annotation.model;
				wrappedPagination = annotation.wrappedPagination;

				restAnnotation = annotation;
			}

			// @Route annotation
			if (annotation instanceof Route){
				prefix = annotation.path;
			}
		});

		// find method annotations
		methodAnnotations.forEach(function(annotation){

			// @Route annotation
			if (annotation instanceof Route){
				
				var methods = annotation.methods;

				if (typeof methods === 'undefined' || methods === null){
					methods = ['GET'];
				}

				// loop through route methods [GET,POST,etc...]
				for (var x in methods){
					
					var path = (prefix + annotation.path)

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
						path: path
					}); 
				}
			}

			// @RestModifyCriteria
			if (annotation instanceof RestModifyCriteria){
				restModifyCriteriaMethods.push(annotation.target);
			}

			// @Jsonp
			if (annotation instanceof Jsonp){
				
			}
		});

		// build the controller prototype
		var C = require(controller.filePath); 
		var obj;

		if (controllerType == 'REST'){
			var adapterPath = container.get('namespace.resolver').resolveWithSubpath(restAdapter, 'lib');
			var Rest = require(adapterPath);
			_.extend(Rest.prototype, C.prototype);
			obj = new Rest(container, restModel, restAnnotation.options);
		} else {
			var obj = new C();	
		}

		obj.container = container;

		if (controllerType === 'REST'){

			obj.wrappedPagination = wrappedPagination;
			obj.restModifyCriteriaMethods = restModifyCriteriaMethods;

			// build all of the REST method routes
			this.restMethods.forEach(function(restMethod){

				var name = prefix.replace('/', '') + '.' + restMethod.action;
				var path = prefix + restMethod.path;
				path = path.replace('//', '/').replace(/\/+$/, ''); // clean up weird concats

				routes.push({
					name: name,
					controller: controller.serviceId,
					action: restMethod.action,
					method: restMethod.method,
					path: path
				});
			});
		}

		// add controller to container
		container.set(controller.serviceId, obj);
		
		return routes;
	}
};

module.exports = RoutingAnnotationHandler;