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
var SecurityAnnotation = require('../security');

/**
 * The SecurityAnnotationHandler handles all the @Security annotations
 * that are found within a controller and sets the information on the
 * applications DIC container
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 */
var SecurityAnnotationHandler = function(){};

SecurityAnnotationHandler.prototype = {
	
	/**
	 * Get the annotation paths that should be parsed
	 *
	 * @return {Array}
	 */
	getAnnotationPaths: function(){
		return [
			path.join(__dirname, '..', 'security')
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

		// parse the security rules from the controller
		var securityRules = this.parseSecurityRulesFromFile(container, reader, controller);

		// make sure that container has a security rules object
		if (!container.hasParameter('conga.security.rules')){
			container.setParameter('conga.security.rules', {});
		}

		// store routes for express to use later on
		for (var i in securityRules){
			container.getParameter('conga.security.rules')[i] = securityRules[i];
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
	 *            roles: ['ROLE1', 'ROLE2']
	 *          }
	 *      }
	 * }
	 * 
	 * @param {Container} container
	 * @param {Reader} reader
	 * @param {Object} controller
	 * @returns {Object}
	 */
	parseSecurityRulesFromFile: function(container, reader, controller){

		// set up return object
		var securityRules = {};
		
		// parse the annotations
		reader.parse(controller.filePath);

		var constructorAnnotations = reader.getConstructorAnnotations();

		constructorAnnotations.forEach(function(annotation){

			// @Security annotation
			if (annotation instanceof SecurityAnnotation){
				securityRules[controller.serviceId] = {
					'*' : {
						roles: annotation.roles
					}
				};
			}
		});

		// get the annotations
		var methodAnnotations = reader.getMethodAnnotations();
		
		// find method annotations
		methodAnnotations.forEach(function(annotation){

			// @Security annotation
			if (annotation instanceof SecurityAnnotation){
				
				// add service id to template hash
				if(typeof securityRules[controller.serviceId] === 'undefined'){
					securityRules[controller.serviceId] = {};         
				}
				
				securityRules[controller.serviceId][annotation.target] = {
					roles: annotation.roles
				};
			}
		});

		return securityRules;
	},

};

module.exports = SecurityAnnotationHandler;