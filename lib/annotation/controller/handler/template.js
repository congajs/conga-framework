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

// third-party modules
var _ = require('lodash');

// local modules

/**
 * The TemplateAnnotationHandler handles all the @Template annotations
 * that are found within a controller and sets the information on the
 * applications DIC container
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 */
var TemplateAnnotationHandler = function(){};

TemplateAnnotationHandler.prototype = {
	
	/**
	 * Get the annotation paths that should be parsed
	 *
	 * @return {Array}
	 */
	getAnnotationPaths: function(){
		return [
			path.join(__dirname, '..', 'template')
		];
	},

	/**
	 * Handle all of the routing annotations on a controller
	 * 
	 * @param {Container} container
	 * @param {Reader} reader
	 * @param {Object} controller
	 * @returns {Array}
	 */
	handleAnnotations: function(container, reader, controller){

		// parse the templates from the controller
		var templates = this.parseTemplatesFromFile(container, reader, controller);

		// make sure that container has templates object
		if (!container.hasParameter('conga.templates')){
			container.setParameter('conga.templates', {});
		}

		// store routes for express to use later on
		for (var i in templates){
			container.getParameter('conga.templates')[i] = templates[i];
		}
	},
		
	/**
	 * Find the annotations in a controller and create a mapping 
	 * of controllers/actions to their templates
	 * 
	 * Sets an object with the following format on the Container:
	 * 
	 * {
	 *    controller.id : {
	 *          action: {
	 *            bundle: '',
	 *            controller: '',
	 *            template: ''
	 *          }
	 *      }
	 * }
	 * 
	 * @param {Container} container
	 * @param {Reader} reader
	 * @param {Object} controller
	 * @returns {Object}
	 */
	parseTemplatesFromFile: function(container, reader, controller){

		// set up return object
		var templates = {};
		
		// parse the annotations
		reader.parse(controller.filePath);
		
		// get the annotations
		var methodAnnotations = reader.methodAnnotations;
		
		// find method annotations
		methodAnnotations.forEach(function(annotation){

			// @Template annotation
			if (annotation.constructor.name === 'TemplateAnnotation'){

				// add service id to template hash
				if (typeof templates[controller.serviceId] === 'undefined'){
					templates[controller.serviceId] = {};         
				}
				
				// build the template namespace
				var namespace = controller.bundle + ':' + 
								require('path').basename(controller.filePath).replace('.js', '') + '/' +
								annotation.target;
				
				templates[controller.serviceId][annotation.target] = {
					namespace: annotation.path !== null ? annotation.path : namespace
				};
			}
		});

		return templates;
	},
};

module.exports = TemplateAnnotationHandler;