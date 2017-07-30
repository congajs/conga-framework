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
const ContainerBuilder = require('@conga/dependency-injection').ContainerBuilder;
const traverse = require('traverse');

// local modules
const BundleFinder = require('../bundle/BundleFinder');
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

        /**
         * Hash of specific bundle paths
         *
         * (this should get used when running tests where a bundle
         *  is outside a standard project path)
         *
         * @type {Object}
         */
        this.bundlePaths = {};

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

        const config = this.loadConfig();
        const bundleFinder = this.createBundleFinder(config);
        const serviceLoader = new ServiceLoader(bundleFinder);

        // build our dependency injection container
        const containerBuilder = new ContainerBuilder(serviceLoader);

        containerBuilder.build(config, (container) => {

            // keep the bundle finder
            container.set('bundle.finder', bundleFinder);

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

            for (let i in events) {

                const event = events[i];

                ((event) => {
                    calls.push(
                        (callback) => {
                            container.get('event.dispatcher')
                                     .dispatch(event, { container : container }, callback);
                        }
                    );
                })(event);
            }

            // run the events!
            async.series(calls, (err, results) => {
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
     * @return {void}
     */
    ensureCacheDirectoryExists(container) {
        container.get('fs-extra').ensureDirSync(container.getParameter('kernel.app_cache_path', 777));
    }

    /**
     * Load the services/app config
     *
     * @return {Object}
     */
    loadConfig() {

        const configLoader = new ConfigLoader();
        const config = configLoader.load(
            this.projectRootPath,
            this.app,
            this.environment,
            this.createDefaultConfig()
        );

        // override config if any options were passed in
        this.overrideConfig(config);

        return config;
    }

    /**
     * Override the config with any options that were passed into the kernel
     *
     * @param  {Object}
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

        const conga = require('../../package.json');

        return {
            parameters:  {
                'conga.version': conga.version,
                'bundle.paths': this.bundlePaths,
                'kernel.context': this.context,
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
     * @param  {Container} container
     * @param  {Function} cb
     * @return {void}
     */
    processConfigurations(container, cb) {

        const bundles = container.getParameter('app.bundles');
        const bundlesConfig = container.getParameter('bundles.config');

        // replace any service names found in the config with the actual reference
        // this also checks for specific service function paths and replaces the
        // config variable with a proxy to call the target function
        // example: foo: "${my.service::myFunction}"
        const regex = /\$\{(.*?)\}/i;

        traverse(bundlesConfig).forEach(function(x) {

            if (typeof x === 'string') {

                const match = x.match(regex);

                if (match) {

                    const y = match[1];

                    if (y.includes('::')) {

                        const parts = y.split('::');

                        const func = function() {
                            const instance = container.get(parts[0].replace('@', ''));
                            return instance[parts[1]].apply(instance, arguments);
                        }

                        this.update(func);

                    } else {

                        // need to check if service exists because right now this
                        // conflicts with config parameters that may be referencing
                        // a scoped bundle namespace (i.e. @conga/framework-rest:foo/bar)
                        if (container.has(y)) {
                            this.update(container.get(y));
                        }

                    }
                }
            }
        });

        const calls = [];

        for (let i in bundles) {

            const bundle = bundles[i];

            ((bundle) => {

                const configPath = container.get('namespace.resolver')
                                    .resolveWithSubpath(bundle + ':Configuration.js', 'lib/configuration');

                if (fs.existsSync(configPath)) {

                    const Configuration = require(configPath);
                    const configuration = new Configuration();
                    const bundleConfig = bundlesConfig[configuration.getName()];

                    // validate
                    calls.push(
                        (callback) => {
                            configuration.validate(container, bundleConfig, (err) => {

                                if (err) {
                                    throw new Error("Error in validating configuration for " + bundle + ":");
                                }

                                callback();
                            });
                        }
                    );

                    // process
                    calls.push(
                        (callback) => {
                            configuration.process(container, bundleConfig, callback);
                        }
                    );
                }

            })(bundle);
        }

        // run all the configuration handlers
        async.series(calls, function(err, results) {

            // create Config object and set to container
            const config = new Config(bundlesConfig);
            container.set('config', config);
            cb();
        });
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
     * @param  {Container} container
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
     * @param  {Object} config
     * @return {Array}
     */
    findProjectPaths(config) {

        const paths = [];

        paths.push(path.join(this.projectRootPath, 'src'));
        paths.push(path.join(this.projectRootPath, 'node_modules'));

        return paths;
    }

    /**
     * Add specific bundle paths
     *
     * {
     *    "some-bundle": "/path/to/bundle",
     *    "other-bundle": "/some/other/bundle"
     * }
     *
     * @param  {Object} bundles hash of bundle paths
     * @return {void}
     */
    addBundlePaths(bundles) {
        this.bundlePaths = bundles;
    }

    /**
     * Create the BundleFinder
     *
     * @param   {Object} config the config object
     * @returns {BundleFinder}
     */
    createBundleFinder(config) {
        return new BundleFinder(config.parameters['bundle.paths']);
    }

    /**
     * Find the absolute path for a bundle in the various project paths
     *
     * @param  {String} bundle
     * @return {String}
     */
    findPathForBundle(bundle) {

        const paths = this.findProjectPaths();

        for (let projectPath of paths) {

            const p = path.join(projectPath, bundle);

            if (fs.existsSync(p)) {
                return p;
            }

        };

        return null;
    }

}
