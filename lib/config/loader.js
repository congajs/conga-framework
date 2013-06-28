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
var _ = require('lodash');
var ini = require('ini');
var yaml = require('yamljs');

/**
 * The Loader handles loads all of the config files for a project
 * and converts them into one config object for the current environment
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 */
var Loader = function(){
	this.appParametersAndServices = {
		parameters: {},
		services: {}
	};
};

Loader.prototype = {
	
	/**
	 * The path to the root of the project
	 * 
	 * @var {String}
	 */
	projectPath: null,
	
	/**
	 * The app name to load config for
	 * 
	 * @type {String}
	 */
	app: null,

	/**
	 * The environment to load
	 * 
	 * @var {String}
	 */
	environment: null,
	
	/**
	 * The config object being built
	 * 
	 * @var {Object}
	 */
	config: null,

	/**
	 * App level parameters and services which
	 * will override anything from bundle configs
	 * 
	 * @type {Object}
	 */
	appParametersAndServices: null,

	/**
	 * Load the config object
	 * 
	 * @returns {Object}
	 */
	load: function(projectPath, app, environment, defaults){

		if (typeof defaults !== 'object'){
			defaults = {};
		}

		this.projectPath = projectPath;
		this.app = app;
		this.environment = environment;
		
		// build the empty default config object
		this.config = {
			parameters: {},
			services: []
		};

		// apply defaults
		this.config = _.merge(this.config, defaults);
		
		// load and process all of the config files
		this.loadAppConfig();
		this.loadServiceConfig();

		// override bundle parameters and services with parameters set in app config
		this.config.parameters = _.merge(this.config.parameters, this.appParametersAndServices.parameters);
		this.config.services = _.merge(this.config.services, this.appParametersAndServices.services);

		// merge with all bundle defaults
		this.mergeDefaults();

		// fix parameters
		this.config = this.fixParameters(this.config, this.config);

		return this.config;
	},
	
	/**
	 * Load all of the service files from the project modules
	 * and combine them into the current config object
	 * 
	 * @returns {void}
	 */
	loadServiceConfig: function(){
		
		var config = this.config;
		var bundles = this.config.parameters['app.bundles'];
		var bundlePaths = this.findBundlePaths();

		// store bundle paths in config
		config.parameters['bundle.paths'] = bundlePaths;

		for (var bundle in bundlePaths){

			var p = path.join(bundlePaths[bundle], 'lib', 'resources', 'config', 'services.yml');

			var serviceConfig = this.readConfigFile(p);

			if (serviceConfig.services !== null){

				for (var i in serviceConfig.services){
					var service = serviceConfig.services[i];
					
					// move id to the service object
					service.id = i;
					
					// check if there are tags and fix the format to what the container builder expects
					if (typeof service.tags !== 'undefined'){
						var tmpTags = [];
						service.tags.forEach(function(tag){
							var newTag = {};
							newTag.name = tag.name;
							delete tag.name;
							newTag.parameters = tag;
							tmpTags.push(newTag);
						});

						service.tags = tmpTags;
					}
					
					config.services.push(service);
				}
			}
			
			for (var i in serviceConfig.parameters){
				config.parameters[i] = serviceConfig.parameters[i];
			}
		}
	},

	/**
	 * Create a hash of bundle names to their absolute paths
	 * 
	 * @return {Object}
	 */
	findBundlePaths: function(){

		var bundles = this.config.parameters['app.bundles'];
		var paths = {};

		var moduleDir = path.join(this.projectPath, 'node_modules');
		var projectBundleDir = path.join(this.projectPath, 'src');

		// manually add the conga framework bundle
		// @TODO - may need to change how this path is computed
		paths['conga-framework'] = path.join(__dirname, '..', '..', '..', 'conga-framework');

		bundles.forEach(function(bundle){

			var modulePath = path.join(moduleDir, bundle);
			var bundlePath = path.join(projectBundleDir, bundle);

			if (fs.existsSync(modulePath)){
				paths[bundle] = modulePath;
			} else if (fs.existsSync(bundlePath)){
				paths[bundle] = bundlePath;
			} else {
				console.log('Error: bundle not found in ' + modulePath + ' or ' + projectBundleDir + ':');
				console.log(bundle);
				process.exit();
			}
		});

		return paths;
	},
	
	/**
	 * Load all of the app configuration into the container
	 * 
	 * @returns {void}
	 */
	loadAppConfig: function(){

		// use the environment specific config file
		var configFile = path.join(this.projectPath, this.app, 'config', 'config_' + this.environment + '.yml');
		
		if (!fs.existsSync(configFile)){
			configFile = path.join(this.projectPath, this.app, 'config', 'config.yml');
		}
		
		var appConfig = this.readConfigFile(configFile, this.config);

		// copy over values to main config
		this.setParameter('app.bundles', appConfig.bundles);

		// hold on to app level parameters to merge later on
		this.appParametersAndServices.parameters = appConfig['parameters'];

		delete appConfig.app;
		delete appConfig.bundles;
		delete appConfig.parameters;

		this.setParameter('bundles.config', appConfig);
	},
	
	/**
	 * Set a parameter on the current config
	 * 
	 * @param key
	 * @param value
	 */
	setParameter: function(key, value){
		this.config.parameters[key] = value;
	},
 
	/**
	 * Read and parse a config file
	 * 
	 * This method finds includes within the file and recursively
	 * merges the included files into the final config object
	 * 
	 * @param {String} p
	 * @returns {Object}
	 */
	readConfigFile: function(filePath, existingConfig){

		var config = this.loadConfigFile(filePath);

		if (typeof existingConfig !== 'undefined'){
			config = _.merge(config, existingConfig);
		}

		if (config !== null){
			
			// check if we need to handle any imported resources
			if (typeof config.imports !== 'undefined'){

				var dir = path.dirname(filePath);
				config.imports.forEach(function(fileImport){
					var child = this.readConfigFile(path.join(dir, fileImport.resource));
					config = this.fixParameters(child, config);
					config = this.mergeConfig(child, config);
				}, this);

				// clear out includes from final object
				delete config.imports;
			}

			return config;
		}
		
		return {};
	},

	/**
	 * Load and parse a yml or ini file from a given absolute path
	 * 
	 * @param  {String} filePath
	 * @return {Object}
	 */
	loadConfigFile: function(filePath){

		if (!fs.existsSync(filePath)){
			console.error('Config file doesn\'t exist: ' + filePath);
			process.exit();
		};

		var contents = fs.readFileSync(filePath, 'utf-8');

		switch (path.extname(filePath)){

			case '.yml':

				try {

					return yaml.parse(contents);
					break;

				} catch (e) {

					console.log('YAML Parse Error in: ' + filePath);
					console.log('Line: ' + e.parsedLine);
					console.log('Snippet: ' + e.snippet);

					process.exit();
				}


			case '.ini':

				return ini.parse(contents);
				break;

			default:

				console.error('Invalid config file format: ' + filePath);
				process.exit();

				break;
		}
	},

	/**
	 * Merge two config objects together
	 * 
	 * @param  {Object} newConfig
	 * @param  {Object} config
	 * @return {Object}
	 */
	mergeConfig: function(config, newConfig){

		// merge the config objects
		config = _.merge(config, newConfig);
		return config;
	},

	/**
	 * Replace any placeholders using keys from parameters.ini
	 * with their actual values in the final config object
	 * 
	 * @returns {Object}
	 */
	fixParameters: function(config, newConfig){

		var parameters = config.parameters;
		var configString = JSON.stringify(newConfig);
	
		// loop through and replace all parameters
		for (var i in parameters){
			var regex = new RegExp("%" + i + "%", "g");
			configString = configString.replace(regex, parameters[i]);
		}
	
		newConfig = JSON.parse(configString);
		return newConfig;
	},

	/**
	 * Merge the current config object with all of the bundle defaults
	 * 
	 * @return {void}
	 */
	mergeDefaults: function(){

		var bundlePaths = this.config.parameters['bundle.paths'];

		for (var bundle in bundlePaths){

			var defaultConfigPath = path.join(bundlePaths[bundle], 'lib', 'resources', 'config', 'config.default.yml');

			if (fs.existsSync(defaultConfigPath)){

				var bundleConfigHandlerPath = path.join(bundlePaths[bundle], 'lib', 'dependency-injection', 'configuration');
				var configName = require(bundleConfigHandlerPath).getName();
				var defaultConfig = this.loadConfigFile(defaultConfigPath);

				if (defaultConfig[configName] === null){
					defaultConfig[configName] = {};
				}

				// check if anything was configured in application
				if (typeof this.config['parameters']['bundles.config'][configName] !== 'undefined'){

					// merge application config with defaults
					this.config['parameters']['bundles.config'][configName] 
						= _.merge(defaultConfig[configName], this.config['parameters']['bundles.config'][configName]);
				
				} else {

					// just use defaults
					this.config['parameters']['bundles.config'][configName] = defaultConfig[configName];
				}
			}
		}
	}
};

module.exports = Loader;