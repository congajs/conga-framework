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
 * The FilterAnnotationHandler handles the @PreFilter
 * and @PostFilter annotations that are found within 
 * a controller and sets the information on the
 * applications DIC container
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 */
var FilterAnnotationHandler = function(){};

FilterAnnotationHandler.prototype = {
	
	/**
	 * Get the annotation paths that should be parsed
	 *
	 * @return {Array}
	 */
	getAnnotationPaths: function(){
		return [
			path.join(__dirname, '..', 'post-filter'),
			path.join(__dirname, '..', 'pre-filter'),
		];
	},

	/**
	 * Handle all of the @PreFilter and @PostFilter
	 * annotations on a controller
	 * 
	 * @param {Container} container
	 * @param {Reader} reader
	 * @param {Object} controller
	 * @returns {Array}
	 */
	handleAnnotations: function(container, reader, controller){

		// parse the filters from the controller
		var filters = this.parseFiltersFromFile(container, reader, controller);

		// make sure that container has a filters object
		if (!container.hasParameter('conga.controller.filters')){
			container.setParameter('conga.controller.filters', {});
		}

		// store routes for express to use later on
		for (var i in filters){
			container.getParameter('conga.controller.filters')[i] = filters[i];
		}
	},
		
	/**
	 * Find all the filter annotations from a controller file
	 * and return an object with all the filter metadata
	 * 
	 * {
	 *    controller.id : {
	 *          action: {
	 *            pre: [ { service : serviceId, parameters : {} } ],
	 *            post: [ { service : serviceId, parameters : {} ]
	 *          }
	 *      }
	 * }
	 * 
	 * @param {Container} container
	 * @param {Reader} reader
	 * @param {Object} controller
	 * @returns {Object}
	 */
	parseFiltersFromFile: function(container, reader, controller){

		// set up return object
		var filters = {};
		
		// parse the annotations
		reader.parse(controller.filePath);

		var constructorAnnotations = reader.constructorAnnotations;

		constructorAnnotations.forEach(function(annotation){

			// @PreFilter
			if (annotation.annotation === 'PreFilterAnnotation'){
				this.addFilter(filters, controller, '*', 'pre', annotation);
			}

			// @PostFilter
			if (annotation.annotation === 'PostFilterAnnotation'){
				this.addFilter(filters, controller, '*', 'post', annotation);
			}

		}, this);

		// get the annotations
		var methodAnnotations = reader.methodAnnotations;
		
		// find method annotations
		methodAnnotations.forEach(function(annotation){

			// @PreFilter
			if (annotation.annotation === 'PreFilterAnnotation'){
				this.addFilter(filters, controller, annotation.target, 'pre', annotation);
			}

			// @PostFilter
			if (annotation.annotation === 'PostFilterAnnotation'){
				this.addFilter(filters, controller, annotation.target, 'post', annotation);
			}

		}, this);

		return filters;
	},

	/**
	 * Add the filter information for a controller/action/type to the final
	 * filters array
	 * 
	 * @param  {Array} filters
	 * @param  {String} controller
	 * @param  {String} action
	 * @param  {String} type
	 * @param  {Object} annotation
	 * @return {void}
	 */
	addFilter: function(filters, controller, action, type, annotation){

		if (typeof filters[controller.serviceId] === 'undefined'){
			filters[controller.serviceId] = {};
		}

		if (typeof filters[controller.serviceId][action] === 'undefined'){
			filters[controller.serviceId][action] = {};
		}

		if (typeof filters[controller.serviceId][action][type] === 'undefined'){
			filters[controller.serviceId][action][type] = [];
		}

		filters[controller.serviceId][action][type].push(
			{ 
				service : annotation.service, 
				parameters : annotation.parameters 
			}
		);		
	}
};

module.exports = FilterAnnotationHandler;