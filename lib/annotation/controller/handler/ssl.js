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
 * The SSLAnnotationHandler handles the @SSL
 * annotations that are found within 
 * a controller and sets the information on the
 * applications DIC container
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 */
var SSLAnnotationHandler = function(){};

SSLAnnotationHandler.prototype = {
	
	/**
	 * Get the annotation paths that should be parsed
	 *
	 * @return {Array}
	 */
	getAnnotationPaths: function(){
		return [
			path.join(__dirname, '..', 'ssl')
		];
	},

	/**
	 * Handle all of the @SSL
	 * annotations on a controller
	 * 
	 * @param {Container} container
	 * @param {Reader} reader
	 * @param {Object} controller
	 * @returns {Array}
	 */
	handleAnnotations: function(container, reader, controller){

		// parse the ssl rules from the controller
		var sslRules = this.parseRulesFromFile(container, reader, controller);

		// make sure that container has an ssl object
		if (!container.hasParameter('conga.controller.ssl')){
			container.setParameter('conga.controller.ssl', {});
		}

		// store ssl rules for express to use later on
		for (var i in sslRules){
			container.getParameter('conga.controller.ssl')[i] = sslRules[i];
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
	parseRulesFromFile: function(container, reader, controller){

		// set up return object
		var rules = {};
		
		// parse the annotations
		reader.parse(controller.filePath);

		var constructorAnnotations = reader.constructorAnnotations;

		constructorAnnotations.forEach(function(annotation){

			// @SSL
			if (annotation.annotation === 'SSLAnnotation'){
				//this.addFilter(filters, controller, '*', 'pre', annotation);

				if (typeof rules[controller.serviceId] === 'undefined'){
					rules[controller.serviceId] = {};
				}

				rules[controller.serviceId]['*'] = {
					force: annotation.force
				}
			}

		}, this);

		// get the annotations
		var methodAnnotations = reader.methodAnnotations;
		
		// find method annotations
		methodAnnotations.forEach(function(annotation){

			// @SSL
			if (annotation.annotation === 'SSLAnnotation'){

				if (typeof rules[controller.serviceId] === 'undefined'){
					rules[controller.serviceId] = {};
				}

				rules[controller.serviceId][annotation.target] = {
					force: annotation.force
				}
			}

		}, this);

		return rules;
	}
};

module.exports = SSLAnnotationHandler;