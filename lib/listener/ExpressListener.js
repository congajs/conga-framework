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
const http = require('http');
const path = require('path');

// third-party modules
const _ = require('lodash');
const async = require('async');
const bodyParser = require('body-parser');
const express = require('express');
const HttpStatus = require('http-status');

// local modules
const TagSorter = require('../ioc/TagSorter');
const ErrorResponse = require('../response/ErrorResponse');

/**
 * The ExpressListener configures and starts an express
 * server during the various kernel lifecycle events
 *
 * @author  Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class ExpressListener {

    /**
     * Initialize express when the kernel boots up
     *
     * @param {Object} event
     * @param {Function} next
     *
     * @return {Void}
     */
    onKernelBoot(event, next) {

        const container = event.container;

        container.get('logger').debug('[conga-framework] - initializing express');

        this.initializeExpress(container, () => {
            this.registerRoutes(container);
            next();
        });
    }

    /**
     * Register all of the middleware
     *
     * @param  {Object}   event
     * @param  {Function} next
     *
     * @return {void}
     */
    onKernelRegisterMiddleware(event, next) {

        const container = event.container;
        const app = container.get('express.app');

        container.get('logger').debug('[conga-framework] - registering express middleware');

        // register middleware
        this.registerMiddleware(container, next);

    }

    /**
     * Initialize the express app
     *
     * @param {Container} container
     * @param {Function}  next
     */
    initializeExpress(container, next) {

        // create the express app
        const app = express();

        this.container = container;

        container.set('express', express);

        // store express app in the container
        container.set('express.app', app);

        // create http server
        const httpServer = require('http').createServer(app);
        container.set('express.server', httpServer);

        // register public asset paths
        this.registerPublicPaths(container);

        const config = container.get('config').get('framework').express;

        // set express settings
        app.set('view cache', config.view.cache);

        // add some middleware to enhance request and response
        //app.use(this.enhanceRequest.bind(this));
        app.use(this.enhanceResponse.bind(this));

        // pre-register middleware (this gives you a chance to register middleware with high priority before anything else)
        this.preRegisterMiddleware(container, () => {

            app.use(function(req, res, next) {

                if (req.method === 'OPTIONS') {
                    // kernel.pre_flight_request
                    container.get('event.dispatcher').dispatch(
                        'kernel.pre_flight_request',
                        {
                            container : container,
                            request : req,
                            response: res
                            //route: req.conga.route
                        },
                        function(){
                            // empty
                        }
                    );
                } else {
                    next();
                }
            });

            // app.use(express.urlencoded());
            // app.use(express.json());
            // app.use(express.cookieParser());

            //app.use(bodyParser.json());

            // add the body parser and wrap some error checking for bad json data
            const parseJson = bodyParser.json();

            app.use(function (req, res, next) {
                parseJson(req, res, (err) => {
                    if (err) {
                        req.body = null;
                        req._ERROR_BAD_JSON = true;
                    }
                    next();
                });
            });

            this.registerSession(container, app);
            this.registerPreFlightListeners(container);
            this.registerControllerListeners(container);

            next(app);

        });
    }

    /**
     * Register the pre_flight_request listeners
     *
     * @param  {Container} container
     * @return {void}
     */
    registerPreFlightListeners(container) {

        const tags = container.getTagsByName('kernel.pre_flight_request');

        if (!tags) {
            return;
        }

        tags.forEach((tag) => {
            container.get('event.dispatcher').addListener(
                'kernel.pre_flight_request',
                container.get(tag.getServiceId()),
                tag.getParameter('method')
            );
        });
    }

    /**
     * Register the controller listeners
     *
     * @param  {Container} container
     * @return {void}
     */
    registerControllerListeners(container) {

        const tags = container.getTagsByName('kernel.pre_controller');

        if (!tags) {
            return;
        }

        tags.forEach((tag) => {
            container.get('event.dispatcher').addListener(
                'kernel.pre_controller',
                container.get(tag.getServiceId()),
                tag.getParameter('method')
            );
        });
    }

    /**
     * Enhance the request
     *
     * @param  {Object} req
     * @param  {Object} res
     * @param  {Function} next
     * @return {Void}
     */
    enhanceResponse(req, res, next) {

        /**
         * Generic return method to send data from a controller and eventually
         * pass off to a ResponseHandler
         *
         * @param  {Object} data the response data
         * @param  {Number} code the HTTP status code
         * @return {Void}
         */
        res.return = (data, code = 200) => {

            const route = req.conga.route;

            // run the post filters
            this.container.get('conga.filter.runner').run(
                route.controller,
                route.action,
                'post',
                req,
                res,
                () => {

                    this.handleResponse(req, res, data, code);

                }
            );
        };

        /**
         * Error method to return an error and pass it off to the ResponseHandler
         * for the Route
         *
         * @param  {ResponseError} error
         * @return {Void}
         */
        res.error = (error) => {

            // make sure a ResponseError was passed in
            if (!(error instanceof ErrorResponse)) {
                error = new ErrorResponse({
                    error: 'Res.error() must be called with an instance of ErrorResponse',
                    originalError: error
                }, 500);
            }

            this.handleError(req, res, error);
        };

        next();
    }

    /**
     * Configure the session info, store, etc. on express
     *
     * @param  {Container} container
     * @param  {Object}    app
     * @return {Void}
     */
    registerSession(container, app) {

        // set the default config
        const defaults = {
            enabled: true,
            key: 'conga.sid',
            secret: 'keyboardcat',
            cookie_name: 'congajs',
            lifetime: 3600,
            store: 'memory'
        };

        let config = container.get('config').get('framework').session;

        // merge config with defaults
        config = _.merge(defaults, config);

        if (config.enabled === true){

            let storeObject;

            // if (config.store.type === 'memory'){
            //  storeObject = new express.session.MemoryStore
            // } else {
            //  var storePath = path.join(
            //      container.getParameter('kernel.project_path'),
            //      'node_modules',
            //      config.store.type
            //  );
            //  var store = require(storePath)(express);
            //  storeObject = new store(config.store.options);
            // }

            // container.set('session.store', storeObject);

            // app.use(express.session({
            //  key: config.key,
            //  secret: config.secret,
            //  maxAge: new Date(Date.now() + config.lifetime),
            //  store: storeObject
            // }));
        }
    }

    /**
     * Find all of the pre-register middleware tags and register them
     *
     * @param  {Container} container
     * @param  {Function}  done
     * @return {void}
     */
    preRegisterMiddleware(container, done){

        const tags = container.getTagsByName('app.pre_middleware');

        if (!tags || tags.length === 0){
            done();
            return;
        }

        // sort tags by priority
        TagSorter.sortByPriority(tags);

        const calls = [];

        for (let i in tags) {
            const tag = tags[i];

            (function(tag){
                calls.push(
                    function(callback){
                        const service = container.get(tag.getServiceId());
                        const method = tag.getParameter('method');

                        service[method].call(service, container, container.get('express.app'), callback);
                    }
                );
            }(tag));
        }

        // run the events!
        async.series(calls, (err, results) =>{
            done();
        });
    }

    /**
     * Find all of the registered middleware tags and register them
     *
     * @param  {Container} container
     * @param  {Function} done
     * @return {void}
     */
    registerMiddleware(container, done) {

        const tags = container.getTagsByName('app.middleware');

        if (!tags || tags.length === 0) {
            done();
            return;
        }

        // sort tags by priority
        TagSorter.sortByPriority(tags);

        const calls = [];

        for (let i in tags) {

            const tag = tags[i];

            (function(tag){
                calls.push(
                    function(callback){

                        const service = container.get(tag.getServiceId());
                        const method = tag.getParameter('method');

                        service[method].call(
                            service,
                            container,
                            container.get('express.app'),
                            callback
                        );
                    }
                );
            }(tag));
        }

        // run the events!
        async.series(calls, function(err, results){
            done();
        });
    }

    /**
     * Register the public directories
     *
     * @param  {Container} container
     * @return {void}
     */
    registerPublicPaths(container) {

        const bundles = container.getParameter('app.bundles');

        // make sure that there's a public bundle directory
        const publicBundlePath = path.join(container.getParameter('kernel.app_public_path'), 'bundles');

        if (!fs.existsSync(publicBundlePath)) {
            fs.mkdirSync(publicBundlePath);
        }

        bundles.forEach((bundle) => {

            const dir = path.join(container.get('namespace.resolver').resolve(bundle), 'lib', 'resources', 'public');

            if (!fs.existsSync(dir)) {
                return;
            }

            // create a symlink to the public path for the bundle
            const publicPath = path.join(container.getParameter('kernel.app_public_path'), 'bundles', bundle);

            let stat;
            try {
                stat = fs.lstatSync(publicPath);
            } catch (e) {
                stat = null;
            }

            try {
                if (!stat || (!stat.isDirectory() && !stat.isSymbolicLink())) {
                    fs.symlinkSync(dir, publicPath, 'dir');
                }
            } catch (e) {
                console.error('Unable to create symbolic link for ' + dir + ' => ' + publicPath);
                console.error(e.stack || e);
            }
        });

        // register the main public path
        container.get('express.app').use(require('express').static(container.getParameter('kernel.app_public_path')));
    }

    /**
     * Register the routes on the express app
     *
     * @param  {Container} container
     * @return {void}
     */
    registerRoutes(container) {

        const app = container.get('express.app');
        const routes = container.getParameter('conga.routes');

        if (typeof routes == 'undefined' || routes.length == 0) {
            throw new Error('no routes are defined!');
        }

        // add routes and SSL rules to the Router
        container.get('router').setRoutes(routes);

        // register each route
        routes.forEach(function(route){

            // register the route
            const verb = route.method.toLowerCase();

            // add the express verb action
            app[verb](route.path, (req, res) => {

                container.get('conga.route.runner').run(
                    container,
                    route,
                    req,
                    res
                );

            });

        });

        // handle 404 errors
        app.use((req, res, next) => {
            res.status(404);
            res.send('404: File Not Found');
        });

    }

    /**
     * Handle a response
     *
     * @param  {Object} req
     * @param  {Object} res
     * @param  {Object} data
     * @param  {Number} status
     * @return {void}
     */
    handleResponse(req, res, data, status) {

        const container = this.container;
        const route = req.conga.route;

        // kernel.response
        container.get('event.dispatcher').dispatch(
            'kernel.response',
            {
                request: req,
                response: res,
                data: data,
                status: status,
                container: container
            },
            () => {

                const handler = this.getResponseHandlerForRoute(route);

                if (!handler) {
                    res.status(500).json({
                        error: 'No response handler found for: ' + route.controller + ':' + route.action
                    });

                    return;
                }

                handler['onRenderResponse'].call(handler, req, res, data, status, (err, body) => {

                    // kernel.post.response
                    container.get('event.dispatcher').dispatch(
                        'kernel.post.response',
                        {
                            request: req,
                            response: res,
                            body: body,
                            status: status,
                            container: container
                        },
                        () => {

                            // Clean up scope request
                            if (typeof res.__controller__ !== 'undefined') {
                                delete res.__controller__.container;
                            }

                            handler['onSendResponse'].call(handler, req, res, data, body, status)
                            return;

                        }
                    );
                });
            }
        );
    }

    /**
     * Handle an error response
     *
     * @param  {Object}        req
     * @param  {Object}        res
     * @param  {ErrorResponse} error
     * @return {void}
     */
    handleError(req, res, error) {

        const container = this.container;
        const route = req.conga.route;
        const handler = this.getResponseHandlerForRoute(route);

        // kernel.error.response
        container.get('event.dispatcher').dispatch(
            'kernel.error.response',
            {
                request: req,
                response: res,
                error: error,
                container: container
            },
            () => {
                handler['onErrorResponse'].call(handler, req, res, error);
            }
        );

    }

    /**
     * Get the response handler for a route
     *
     * @param  {Object} route
     * @return {ResponseHandler}
     */
    getResponseHandlerForRoute(route) {

        const container = this.container;

        // check if there is a response handler for the current action
        if (typeof container.getParameter('conga.response.handlers') !== 'undefined'
            && typeof container.getParameter('conga.response.handlers')[route.controller] !== 'undefined'
            && typeof container.getParameter('conga.response.handlers')[route.controller][route.action] !== 'undefined') {

            return container.getParameter('conga.response.handlers')[route.controller][route.action];
        }

        return false;

    }

    /**
     * Boot up the express server
     *
     * @param {Object} event
     * @param {Function} next
     * @return {Void}
     */
    onKernelServerBoot(event, next){

        try {

            const container = event.container;

            // start up HTTP server
            container.get('logger').debug('[conga-framework] - starting http server');
            container.get('express.server').listen(container.get('config').get('framework').app.port);
            container.get('logger').info('[conga-framework] - server started at http://' + container.get('config').get('framework').app.host + ':' + container.get('config').get('framework').app.port);

            next();

        } catch (e){

            // something totally went wrong, so we shouldn't continue
            console.log(e);
            process.exit();
        }
    }
}
