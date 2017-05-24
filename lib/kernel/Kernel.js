/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// built-in modules
const fs = require('fs');
const path = require('path');
const util = require('util');

// third-party modules
const async = require('async');
const ContainerBuilder = require('conga-dependency-injection').ContainerBuilder;

// local modules
const Config = require('../config/Config');
const ConfigLoader = require('../config/Loader');
const ServiceLoader = require('../ioc/ServiceLoader');
const TagSorter = require('../ioc/TagSorter');

/**
 * The Kernel is the parent class for all context specific kernel classes (http, cli)
 * which builds a container and fires the registered kernel listener classes
 * to start up the application
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class Kernel {

	/**
	 * Construct the kernel with project/environment/etc. settings
	 *
	 * @param  {String} projectRootPath  absolute path to project root
     * @param  {String} app              the app name
     * @param  {String} environment      the environment name
     * @param  {Object} options          hash of override options
	 */
	constructor(projectRootPath, app, environment, options) {

		/**
		 * The container that was built
		 *
		 * @var {Container}
		 */
		this.container = null;

		/**
		 * The kernel events to fire in this context
		 *
		 * @type {Array}
		 */
		this.kernelEvents = [];

		this.projectRootPath = projectRootPath;
		this.app = app;
		this.environment = environment;
		this.options = options;

	}

	/**
	 * Boot the Kernel
	 *
	 * @param {Function} cb
	 */
	boot(cb) {

		const startTime = new Date();

		// load the service config
		const config = this.loadConfig();

		// set up the service loader
		const serviceLoader = new ServiceLoader(this.findProjectPaths(config));

		// build our dependency injection container
		const containerBuilder = new ContainerBuilder(serviceLoader);

		containerBuilder.build(config, (container) => {

			// hang on to the container
			this.container = container;

			// fire up the kernel!!!
			this.fireItUp(container, () => {

				const elapsed = new Date() - startTime;
				container.get('logger').info('[conga-framework] - kernel booted in: ' + elapsed + 'ms');

				if (this.context === 'http' && this.environment === 'development') {

					container.get('logger').info("####################################################################");
					container.get('logger').info("#   ██████╗ ██████╗ ███╗   ██╗ ██████╗  █████╗         ██╗███████╗ #");
					container.get('logger').info("#  ██╔════╝██╔═══██╗████╗  ██║██╔════╝ ██╔══██╗        ██║██╔════╝ #");
					container.get('logger').info("#  ██║     ██║   ██║██╔██╗ ██║██║  ███╗███████║        ██║███████╗ #");
					container.get('logger').info("#  ██║     ██║   ██║██║╚██╗██║██║   ██║██╔══██║   ██   ██║╚════██║ #");
					container.get('logger').info("#  ╚██████╗╚██████╔╝██║ ╚████║╚██████╔╝██║  ██║██╗╚█████╔╝███████║ #");
					container.get('logger').info("#   ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝╚═╝ ╚════╝ ╚══════╝ #");
					container.get('logger').info("####################################################################");

				}

				cb(this);
			});
		});
	}

	/**
	 * Shutdown the Kernel
	 *
	 * @param {Function} cb
	 */
	shutdown(cb) {
		this.container.get('logger').info('[conga-framework] - shutting down kernel');
		this.container.get('express.server').close();
		if (typeof cb === 'function') {
			cb(null);
		}
	}

	/**
	 * Start firing up events!!!
	 *
	 * @param {Container} container
	 * @param {Function}  done
	 */
	fireItUp(container, done) {

		// make sure we have the app cache directory
		this.ensureCacheDirectoryExists(container);

		// register namespaces
		this.registerNamespaces(container);

		// set up events on the container
		this.setupKernelEvents(container);

		// keep a reference to the kernel on container
		container.set('kernel', this);

		const events = this.kernelEvents;

		// process all configurations
		this.processConfigurations(container, function(){

			// fire the events
			const calls = [];

			for (var i in events) {

				const event = events[i];

				(function(event) {
					calls.push(
						(callback) => {
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
	}

	/**
	 * Check if the given bundle is registered
	 *
	 * @param  {String}  bundle
	 *
	 * @return {Boolean}
	 */
	hasBundle(bundle) {
		return this.container.getParameter('app.bundles').includes(bundle);
	}

	/**
	 * Make sure that the cache directory exists for current app
	 *
	 * @param  {Container} container
	 *
	 * @return {void}
	 */
	ensureCacheDirectoryExists(container) {
		container.get('wrench').mkdirSyncRecursive(container.getParameter('kernel.app_cache_path', 777));
	}

	/**
	 * Load the services/app config
	 *
	 * @returns {Object}
	 */
	loadConfig() {

		const configLoader = new ConfigLoader();
		const config = configLoader.load(this.projectRootPath, this.app, this.environment, this.createDefaultConfig());

		// override config if any options were passed in
		this.overrideConfig(config);

		return config;
	}

	/**
	 * Override the config with any options that were passed into the kernel
	 *
	 * @param  {Object}
	 *
	 * @return {void}
	 */
	overrideConfig(config) {

		// port
		if (typeof this.options.port !== 'undefined' && this.options.port !== null) {
			config['parameters']['bundles.config']['framework']['app']['port'] = this.options.port;
		}
	}

	/**
	 * Create initial config object with kernel paths, etc.
	 *
	 * @param {Object} config
	 */
	createDefaultConfig() {

		return {
			parameters:  {
				'kernel.environment': this.environment,
				'kernel.project_path': this.projectRootPath,
				'kernel.app_name': this.app,
				'kernel.bundle_path': path.join(this.projectRootPath, 'src'),
				'kernel.app_path': path.join(this.projectRootPath, this.app),
				'kernel.app_cache_path': path.join(this.projectRootPath, 'var', 'cache', this.app, this.environment),
				'kernel.app_public_path': path.join(this.projectRootPath, this.app, 'public'),
				'kernel.var_path': path.join(this.projectRootPath, 'var'),
				'kernel.compiled_path': path.join(this.projectRootPath, 'var', 'compiled')
			}
		}
	}

	/**
	 * Process all of the registered bundles configurations
	 *
	 * @todo  - this needs to be changed or removed
	 *
	 * @param {Container} container
	 * @param {Function} cb
	 *
	 * @return {void}
	 */
	processConfigurations(container, cb) {

		const bundles = container.getParameter('app.bundles');
		const bundlesConfig = container.getParameter('bundles.config');

		// create Config object and set to container
		const config = new Config(bundlesConfig);
		container.set('config', config);

		const calls = [];

		for (var i in bundles) {

			const bundle = bundles[i];

			(function(bundle) {

				const configPath = container.get('namespace.resolver')
									.resolveWithSubpath(bundle + ':configuration.js', 'lib/configuration');

				if (fs.existsSync(configPath)) {

					const configObj = require(configPath);
					const bundleConfig = bundlesConfig[configObj.getName()];

					calls.push(
						function(callback) {
							configObj.process(container, bundleConfig, callback);
						}
					);
				}
			}(bundle));
		}

		// run all the configuration handlers
		async.series(calls, function(err, results) {
			cb();
		});

		// setting the 'client' config here for now
		config.parameters['client'] = bundlesConfig['client'] || {};
	}

	/**
	 * Register all of the namespaces
	 *
	 * @return {void}
	 */
	registerNamespaces(container) {

		const bundlePaths = container.getParameter('bundle.paths');

		for (let bundle in bundlePaths) {
			container.get('namespace.resolver').register(bundle, bundlePaths[bundle]);
		}
	}

	/**
	 * Find all of the tagged kernel events and register them
	 *
	 * @param {Container} container
	 *
	 * @return {void}
	 */
	setupKernelEvents(container) {

		const tags = container.getTagsByName('kernel.event');

		if (!tags){
			return;
		}

		// sort the tags by priority
		TagSorter.sortByPriority(tags);

		tags.forEach((tag) => {
			container.get('event.dispatcher').addListener(
					tag.getParameter('event'),
					container.get(tag.getServiceId()),
					tag.getParameter('method'));
		});
	}

	/**
	 * Build and return an array of service lookup paths for this project
	 *
	 * @param {Object} config
	 * @returns {Array}
	 */
	findProjectPaths(config) {

		const paths = [];

		paths.push(path.join(this.projectRootPath, 'src'));
		paths.push(path.join(this.projectRootPath, 'node_modules'));

		return paths;
	}
}
