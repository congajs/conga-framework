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

// third-party modules
var _ = require('lodash');
var annotations = require('conga-annotations');
var wrench = require('wrench');

// local modules
var RestObjectAnnotation = require('./annotation/rest-object');
var RestPropertyAnnotation = require('./annotation/rest-property');

/**
 * The RestManager keeps track of Restful objects
 * and handles thier serialization
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 */
var RestManager = function(){
	this.objects = [];
};

RestManager.prototype = {

	/**
	 * Parse out all of the REST annotations from objects
	 * and store the information for lookup later on
	 * 
	 * @param container
	 */
	onKernelCompile: function(event, next){

		var self = this;
		var container = event.container;
		var config = container.get('config').get('rest');
		var registry = new annotations.Registry();

		registry.registerAnnotation(path.join(__dirname, 'annotation', 'rest-object'));
		registry.registerAnnotation(path.join(__dirname, 'annotation', 'rest-property'));

		var paths = this.getObjectPathsFromConfig(container, config);

		// create the annotation reader
		var reader = new annotations.Reader(registry);

		paths.forEach(function(p){
			self.parseAnnotations(container, reader, p);
		});		

		// move on
		next();
	},

	/**
	 * Parse the REST annotations from the given file path
	 * 
	 * @param  {Container} container
	 * @param  {Reader} reader
	 * @param  {String} filePath
	 * @return {void}
	 */
	parseAnnotations: function(container, reader, filePath){

		// parse the annotations
		reader.parse(filePath);

		// get the annotations
		var constructorAnnotations = reader.getConstructorAnnotations();
		var propertyAnnotations = reader.getPropertyAnnotations();

		if (constructorAnnotations.length === 0){
			return;
		}

		var properties = [];

		propertyAnnotations.forEach(function(annotation){
			if(annotation instanceof RestPropertyAnnotation){
				properties.push(annotation.target);				
			}
		});

		this.objects.push({
			properties: properties,
			proto: require(filePath)
		});
	},

	/**
	 * Get all the full object paths from the rest configuration namespaces
	 * 
	 * @param  {Container} container
	 * @param  {Object} config
	 * @return {Array}
	 */
	getObjectPathsFromConfig: function(container, config){

		var paths = [];

		if (config.paths){
			config.paths.forEach(function(namespace){

				var dir = container.get('namespace.resolver').resolveWithSubpath(namespace, 'lib');
				var files = wrench.readdirSyncRecursive(dir);

				files.forEach(function(p){
					if(p.substr(-3) === '.js'){
						paths.push(path.join(dir, p));
					}
				});
			});
		}

		return paths;
	},

	/**
	 * Serialize an object or array to it's restful representation
	 * 
	 * @param  {Object} object
	 * @return {Object}
	 */
	serialize: function(object){

		if (object === null){
			return null;
		}

		if (_.isArray(object)){

			var arr = [];

			object.forEach(function(obj){
				arr.push(this.serializeObject(obj));
			}, this);

			return arr;

		} else {
			return this.serializeObject(object);
		}

		return object;
	},

	/**
	 * Recursively serialize an object to it's Restful representation
	 * 
	 * @param  {Object} object
	 * @return {Object}
	 */
	serializeObject: function(object){

		var obj = {};
		var properties = null;

		this.objects.forEach(function(data){
			if (object instanceof data.proto){
				properties = data.properties;
				return;
			}
		});

		if (properties === null){
			return object;
		}

		properties.forEach(function(property){
			obj[property] = object[property];
		});

		return obj;
	}
};

module.exports = RestManager;