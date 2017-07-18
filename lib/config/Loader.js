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

// third-party modules
const _ = require('lodash');
const ini = require('ini');
const yaml = require('js-yaml');

/**
 * The Loader handles loads all of the config files for a project
 * and converts them into one config object for the current environment
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class Loader {

    /**
     * Construct with the default properties
     */
    constructor() {

        /**
         * The path to the root of the project
         *
         * @var {String}
         */
        this.projectPath = null;

        /**
         * The app name to load config for
         *
         * @type {String}
         */
        this.app = null;

        /**
         * The environment to load
         *
         * @var {String}
         */
        this.environment = null;

        /**
         * The config object being built
         *
         * @var {Object}
         */
        this.config = null;

        /**
         * App level parameters and services which
         * will override anything from bundle configs
         *
         * @type {Object}
         */
        this.appParametersAndServices = {
            parameters: {},
            services: {}
        };

    }

    /**
     * Load the config object
     *
     * @param  {String} projectPath the absolute path to the project root
     * @param  {String} app         the app directory name (usually "app")
     * @param  {String} environment the environment name (prod, dev, etc.)
     * @param  {Object} defaults    hash of config defaults
     * @return {Object}
     */
    load(projectPath, app, environment, defaults) {

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

        // replace any environment variables
        this.config = this.fixEnvironmentVariables(this.config);

        return this.config;
    }

    /**
     * Load all of the services.yml files from the project modules
     * and combine them into the current config object
     *
     * @return {void}
     */
    loadServiceConfig() {

        const config = this.config;
        const bundlePaths = _.merge(config.parameters['bundle.paths'], this.findBundlePaths());

        // store bundle paths in config
        config.parameters['bundle.paths'] = bundlePaths;

        for (let bundle in bundlePaths) {

            const p = path.join(bundlePaths[bundle], 'lib', 'resources', 'config', 'services.yml');
            const serviceConfig = this.readConfigFile(p);

            if (serviceConfig.services !== null) {

                let service;

                for (let i in serviceConfig.services) {

                    service = serviceConfig.services[i];

                    // move id to the service object
                    service.id = i;

                    // check if there are tags and fix the format to what the container builder expects
                    if (typeof service.tags !== 'undefined') {
                        const tmpTags = [];
                        service.tags.forEach(function(tag) {
                            const newTag = {};
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

            for (let i in serviceConfig.parameters) {
                config.parameters[i] = serviceConfig.parameters[i];
            }
        }
    }

    /**
     * Create a hash of bundle names to their absolute paths
     *
     * @return {Object}
     */
    findBundlePaths() {

        const bundles = this.config.parameters['app.bundles'];
        const paths = {};
        const moduleDir = path.join(this.projectPath, 'node_modules');
        const projectBundleDir = path.join(this.projectPath, 'src');

        // manually add the conga framework bundle
        paths['@conga/framework'] = path.dirname(path.join(__dirname, '..'));

        bundles.forEach((bundle) => {

            if (typeof this.config.parameters['bundle.paths'] !== 'undefined' && typeof this.config.parameters['bundle.paths'][bundle] !== 'undefined') {
                return;
            }

            const modulePath = path.join(moduleDir, bundle);
            const bundlePath = path.join(projectBundleDir, bundle);

            if (fs.existsSync(modulePath)) {
                paths[bundle] = modulePath;
            } else if (fs.existsSync(bundlePath)) {
                paths[bundle] = bundlePath;
            } else {
                console.log('Error: bundle not found in ' + modulePath + ' or ' + projectBundleDir + ':');
                console.log(bundle);
                process.exit();
            }
        });

        return paths;
    }

    /**
     * Load all of the app configuration into the container
     *
     * @return {void}
     */
    loadAppConfig() {

        // use the environment specific config file
        let configFile = path.join(
            this.projectPath,
            this.app,
            'config',
            'config_' + this.environment + '.yml'
        );

        if (!fs.existsSync(configFile)) {
            configFile = path.join(
                this.projectPath,
                this.app,
                'config',
                'config.yml'
            );
        }

        const appConfig = this.readConfigFile(configFile, this.config);

        // get the bundles for all environments
        let bundles = appConfig.bundles.all;

        // merge in bundles for this environment
        if (appConfig.bundles[this.environment]) {
            bundles = _.union(appConfig.bundles[this.environment], bundles);
        }

        // copy over values to main config
        this.setParameter('app.bundles', bundles);

        // hold on to app level parameters to merge later on
        this.appParametersAndServices.parameters = appConfig['parameters'];

        delete appConfig.app;
        delete appConfig.bundles;
        delete appConfig.parameters;

        this.setParameter('bundles.config', appConfig);
    }

    /**
     * Set a parameter on the current config
     *
     * @param  {String} key
     * @param  {Mixed}  value
     * @return {void}
     */
    setParameter(key, value) {
        this.config.parameters[key] = value;
    }

    /**
     * Read and parse a config file
     *
     * This method finds includes within the file and recursively
     * merges the included files into the final config object
     *
     * @param  {String} filePath       absolute path to config file
     * @param  {Object} existingConfig existing config hash
     * @return {Object}
     */
    readConfigFile(filePath, existingConfig) {

        let config = this.loadConfigFile(filePath);

        if (typeof existingConfig !== 'undefined') {
            config = _.merge(config || {}, existingConfig);
        }

        if (config !== null) {

            if (!config.parameters) {
                config.parameters = {};
            }

            if (!config.services) {
                config.services = {};
            }

            // check if we need to handle any imported resources
            if (typeof config.imports !== 'undefined'){

                const dir = path.dirname(filePath);
                config.imports.forEach((fileImport) => {
                    const child = this.readConfigFile(path.join(dir, fileImport.resource));
                    config = this.fixParameters(child, config);
                    config = this.mergeConfig(child, config);
                });

                // clear out includes from final object
                delete config.imports;
            }

            return config;
        }

        return {};
    }

    /**
     * Load and parse a yml or ini file from a given absolute path
     *
     * @param  {String} filePath  absolute path to the config file
     * @return {Object|void}
     */
    loadConfigFile(filePath){

        if (!fs.existsSync(filePath)) {
            console.error('Config file doesn\'t exist: ' + filePath);
            process.exit();
        }

        const contents = fs.readFileSync(filePath, 'utf-8');

        switch (path.extname(filePath)) {

            case '.yml':

                try {

                    return yaml.safeLoad(contents, {
                        noCompatMode: false,

                    });

                } catch (e) {

                    console.log('YAML Parse Error in: ' + filePath);
                    console.log(e.message);

                    process.exit();
                }
                break;

            case '.ini':

                return ini.parse(contents);
                break;

            default:

                console.error('Invalid config file format: ' + filePath);
                process.exit();

                break;
        }
    }

    /**
     * Merge two config objects together
     *
     * @param  {Object} config
     * @param  {Object} newConfig
     * @return {Object}
     */
    mergeConfig(config, newConfig) {

        // merge the config objects
        config = _.merge(config, newConfig);
        return config;
    }

    /**
     * Replace any placeholders using keys from parameters.ini
     * with their actual values in the final config object
     *
     * @param  {Object} config
     * @param  {Object} newConfig
     * @return {Object}
     */
    fixParameters(config, newConfig) {

        const parameters = config.parameters;
        let configString = JSON.stringify(newConfig);
        let regex;

        // loop through and replace all parameters
        for (var i in parameters) {
            regex = new RegExp("%" + i + "%", "g");
            configString = configString.replace(regex, parameters[i]);
        }

        // fix null values (nulls get converted to strings (i.e. "null") from the original yml)
        configString = configString.replace(/"null"/g, 'null');

        return JSON.parse(configString);
    }

    /**
     * Replace any environment variable placeholders with the actual
     * environment variables if they exist. Otherwise use default value
     * within the placeholder.
     *
     * Example:
     *
     *     foo: "$ENV{MY_VARIABLE, 'the default value'}"
     *
     *
     * @param  {Object} config
     * @return {Object}
     */
    fixEnvironmentVariables(config) {

        const envs = process.env;
        const regex = /\$ENV\{(.*?)\}/g;

        let configString = JSON.stringify(config);
        let finalString = configString;
        let matches;

        while ((matches = regex.exec(configString)) !== null) {

            let args = matches[1].split(',');
            let env = args[0].trim();
            let def = args[1].trim().replace(/\'/g, "");

            const val = typeof envs[env] !== 'undefined' ? envs[env] : def;

            finalString = finalString.replace(matches[0], val);
        }

        return JSON.parse(finalString);

    }

    /**
     * Merge the current config object with all of the bundle defaults
     *
     * @return {void}
     */
    mergeDefaults() {

        const bundlePaths = this.config.parameters['bundle.paths'];

        for (var bundle in bundlePaths) {

            const defaultConfigPath = path.join(
                bundlePaths[bundle],
                'lib',
                'resources',
                'config',
                'config.default.yml'
            );

            if (fs.existsSync(defaultConfigPath)) {

                let bundleConfigHandlerPath = path.join(
                    bundlePaths[bundle],
                    'lib',
                    'dependency-injection',
                    'Configuration'
                );

                let configName = require(bundleConfigHandlerPath).getName();
                let defaultConfig = this.loadConfigFile(defaultConfigPath);

                if (defaultConfig[configName] === null) {
                    defaultConfig[configName] = {};
                }

                // check if anything was configured in application
                if (typeof this.config['parameters']['bundles.config'][configName] !== 'undefined') {

                    // merge application config with defaults
                    this.config['parameters']['bundles.config'][configName] = _.merge(
                        defaultConfig[configName],
                        this.config['parameters']['bundles.config'][configName]
                    );

                } else {

                    // just use defaults
                    this.config['parameters']['bundles.config'][configName] = defaultConfig[configName];
                }
            }
        }
    }
}
