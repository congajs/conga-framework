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
var util = require('util');

// third-party modules
var async = require('async');
var ContainerBuilder = require('conga-dependency-injection').ContainerBuilder;

// local modules
var Config = require('../config/config');
var ConfigLoader = require('../config/loader');
var ServiceLoader = require('../ioc/service-loader');

/**
 * The Kernel is the parent class for all context specific kernel classes (http, cli)
 * which builds a container and fires the registered kernel listener classes
 * to start up the application
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 * 
 * @param  {String} projectRootPath  absolute path to project root
 * @param  {String} app              the app name
 * @param  {String} environment      the environment name
 * @param  {Object} options          hash of override options
 */
var Kernel = function(projectRootPath, app, environment, options){
	this.projectRootPath = projectRootPath;
	this.app = app;
	this.environment = environment;
	this.options = options;
};

Kernel.prototype = 
{
	/**
	 * The container that was built
	 * 
	 * @var {Container}
	 */
	container: null,
	
	/**
	 * The kernel events to fire in this context
	 * 
	 * @type {Container}
	 */
	kernelEvents: [],

	/**
	 * Boot the Kernel
	 * 
	 * @param {Function} cb
	 */
	boot: function(cb){

		/**
		 * Add some global utilities
		 * 
		 * @type {Object}
		 */
		GLOBAL.Conga = {

			/**
			 * Simple method to be able to extend constructors
			 * 
			 * @param  {Function} sub
			 * @param  {Function} sup
			 * @return {Function}
			 */
			extend: function(sub, sup){
				Object.keys(sup.prototype).forEach(function(key){
					sub.prototype[key] = sup.prototype[key];
				});
				return sub;
			}
		};

		var self = this;

		var startTime = new Date();

		// load the service config
		var config = this.loadConfig();

		// set up the service loader
		var serviceLoader = new ServiceLoader(this.findProjectPaths(config));
		
		// build our dependency injection container
		var containerBuilder = new ContainerBuilder(serviceLoader);

		containerBuilder.build(config, function(container){
			
			// hang on to the container
			self.container = container;

			// fire up the kernel!!!
			self.fireItUp(container, function(){

				var elapsed = new Date() - startTime;
				container.get('logger').info('kernel booted in: ' + elapsed + 'ms'); 

				cb(self);
			});
		});
	},

	/**
	 * Shutdown the Kernel
	 * 
	 * @param {Function} cb
	 */
	shutdown: function(cb){
		this.container.get('logger').info('shutting down kernel');
		this.container.get('express.server').close();
		cb(null);
	},
	
	/**
	 * Start firing up events!!!
	 * 
	 * @param {Container} container
	 */
	fireItUp: function(container, done){
		
		// register namespaces
		this.registerNamespaces(container);
	
		// set up events on the container
		this.setupKernelEvents(container);

		var events = this.kernelEvents;

		// process all configurations
		this.processConfigurations(container, function(){

			// fire the events
			var calls = [];
			
			for (var i in events){
				var event = events[i];

				(function(event){
					calls.push(
						function(callback){
							container.get('event.dispatcher')
										.dispatch(event, { container : container }, callback);
						}
					);
				}(event));
			}

			// run the events!
			async.series(calls, function(err, results){
				done();
			});
		});
	},
		
	/**
	 * Load the services/app config
	 * 
	 * @returns {Object}
	 */
	loadConfig: function(){

		var configLoader = new ConfigLoader();
		var config = configLoader.load(this.projectRootPath, this.app, this.environment, this.createDefaultConfig());
		
		// override config if any options were passed in
		this.overrideConfig(config);

		return config;
	},

	/**
	 * Override the config with any options that were passed into the kernel
	 * 
	 * @param  {Object}
	 * @return {void}
	 */
	overrideConfig: function(config){

		// port
		if (typeof this.options.port !== 'undefined' && this.options.port !== null){
			config['parameters']['app.config'].port = this.options.port;
		}
	},
		
	/**
	 * Create initial config object with kernel paths, etc.
	 * 
	 * @param {Object} config
	 */
	createDefaultConfig: function(){

		return {
			parameters:  {
				'kernel.environment': this.environment,
				'kernel.project_path': this.projectRootPath,
				'kernel.bundle_path': path.join(this.projectRootPath, 'src'),
				'kernel.app_path': path.join(this.projectRootPath, this.app),
				'kernel.app_cache_path': path.join(this.projectRootPath, this.app, 'cache'),    
				'kernel.app_public_path': path.join(this.projectRootPath, this.app, 'public')
			}		
		}
	},
	
	/**
	 * Process all of the registered bundles configurations
	 *
	 * @todo  - this needs to be changed or removed
	 * 
	 * @param {Container} container
	 * @param {Function} cb
	 */
	processConfigurations: function(container, cb){

		var bundles = container.getParameter('app.bundles');
		var bundlesConfig = container.getParameter('bundles.config');
		
		// create Config object and set to container
		var config = new Config(bundlesConfig);
		container.set('config', config);

		var calls = [];

		for (var i in bundles){

			var bundle = bundles[i];

			(function(bundle){

				var configPath = container.get('namespace.resolver')
									.resolveWithSubpath(bundle + ':configuration.js', 'lib/configuration');
				
				if (fs.existsSync(configPath)){

					var configObj = require(configPath);
					var bundleConfig = bundlesConfig[configObj.getName()];

					calls.push(
						function(callback){
							configObj.process(container, bundleConfig, callback);
						}
					);
				}
			}(bundle));
		}

		// run all the configuration handlers
		async.series(calls, function(err, results){
			cb();
		});

		// setting the 'client' config here for now
		config.parameters['client'] = bundlesConfig['client'] || {};
	},

	/**
	 * Register all of the namespaces
	 * 
	 * @returns {void}
	 */
	registerNamespaces: function(container){

		var bundlePaths = container.getParameter('bundle.paths');

		for (var bundle in bundlePaths){
			container.get('namespace.resolver').register(bundle, bundlePaths[bundle]);
		}
	},
	
	/**
	 * Find all of the tagged kernel events and register them
	 * 
	 * @param container
	 */
	setupKernelEvents: function(container){

		var tags = container.getTagsByName('kernel.event');

		if (!tags){
			return;
		}

		// sort the tags by priority
		require('../ioc/tag-sorter').sortByPriority(tags);

		tags.forEach(function(tag){
			container.get('event.dispatcher').addListener(
					tag.getParameter('event'), 
					container.get(tag.getServiceId()), 
					tag.getParameter('method'));			
		});
	},

	/**
	 * Build and return an array of service lookup paths for this project
	 * 
	 * @param {Object} config
	 * @returns {Array}
	 */
	findProjectPaths: function(config){
		
		var paths = [];

		paths.push(path.join(this.projectRootPath, 'src'));
		paths.push(path.join(this.projectRootPath, 'node_modules'));

		return paths;
	}
};

module.exports = Kernel;