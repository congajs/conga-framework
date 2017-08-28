/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// built-in modules
const fs = require('fs-extra');
const http = require('http');
const path = require('path');

// third-party modules
const _ = require('lodash');
const async = require('async');
const bodyParser = require('body-parser');
const express = require('express');

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
     * @return {void}
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
     * @return {void}
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

        // add some middleware to enhance request and response
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

            // add the body parser and wrap some error checking for bad json data
            const parseJson = bodyParser.json();

            app.use(function (req, res, next) {
                parseJson(req, res, (err) => {

                    if (err) {

                        try {

                            JSON.parse(req.body);

                        } catch (e) {

                            req.body = null;
                            req._ERROR_BAD_JSON = e.message;

                        }

                    }

                    next();

                });
            });

            app.use(bodyParser.urlencoded({ extended: true }));

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
     * Enhance the request with return() and error() functions which are the
     * standard functions to return a response and pass it off to the
     * appropriate listeners, handlers, etc.
     *
     * @param  {Object}    req
     * @param  {Object}    res
     * @param  {Function}  next
     * @param  {Container} [container] the scoped service container, if any
     * @return {void}
     */
    enhanceResponse(req, res, next, container = null) {

        if (!container) {
            container = this.container;
        }

        const cleanup = () => {
            container.get('conga.route.runner').destroyRequestScope(req, res, container, () => {
                // empty for now
            });
        };

        /**
         * Generic return method to send data from a controller and eventually pass off to a ResponseHandler
         *
         * @param  {Object} data the response data
         * @param  {Number} code the HTTP status code
         * @return {void}
         */
        res.return = (data, code = 200) => {

            const route = req.conga.route;

            // run the post filters
            container.get('conga.filter.runner').run(
                route.controller,
                route.action,
                'post',
                req,
                res,
                err => {
                    if (err) {
                        this.handleError(req, res, err, container)
                            .then(cleanup)
                            .catch(cleanup);
                    } else {
                        this.handleResponse(req, res, data, code, container)
                            .then(cleanup)
                            .catch(cleanup);
                    }
                }
            );
        };

        /**
         * Error method to return an error and pass it off to the ResponseHandler for the Route
         *
         * @param  {Error} error The error object
         * @param  {Number} [status] If not provided, error.status is used, if error.status is not defined, 500 is used
         * @return {void}
         */
        res.error = (error, status = 500) => {

            // make sure we have an instance of Error
            if (!(error instanceof Error)) {
                error = new ErrorResponse({
                    error: 'Res.error() must be called with an instance of Error',
                    originalError: error
                }, 500);
            }

            if (!error.status) {
                error.status = status;
            }

            this.handleError(req, res, error, container).then(cleanup).catch(cleanup);
        };

        /**
         * Overload the redirect method to execute events
         */

        // don't overload the original more than once
        if (!res.__redirectFn) {
            res.__redirectFn = res.redirect;
        }

        const self = this;
        res.redirect = function() {
            // NOTE: using function so we can access dynamic arguments, res.redirect([status,] path)

            // avoid infinite loops inside event handlers
            let response = Object.create(res);
            response.redirect = res.__redirectFn.bind(res);

            let path, status;
            if (arguments.length === 2) {
                [ status, path ] = arguments;
            } else {
                [ path ] = arguments;
            }

            self.handleRedirect(req, response, path, status, container).then(cleanup).catch(cleanup);
        };

        next();
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

        // make sure that there's a public bundle directory (and account for @conga directory)
        fs.ensureDirSync(path.join(
            container.getParameter('kernel.app_public_path'),
            'bundles',
            '@conga'
        ));

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
        container.get('express.app').use(
            require('express').static(container.getParameter('kernel.app_public_path'))
        );
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

        if (typeof routes === 'undefined' || routes.length === 0) {
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
     * @param  {Object}    req
     * @param  {Object}    res
     * @param  {Object}    data
     * @param  {Number}    status
     * @param  {Container} [container] the scoped service container, if any
     * @return {Promise}
     */
    handleResponse(req, res, data, status, container = null) {

        if (!container) {
            container = this.container;
        }

        const route = req.conga.route;

        let stopwatchEvent = container.has('profiler.stopwatch') && container.get('profiler.stopwatch')
            .request(req, 'kernel.response').start();

        return new Promise((resolve, reject) => {

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
                err => {

                    if (err) {
                        // if there was an error running kernel.response handlers use error handler
                        this.handleError(req, res, err).then(resolve).catch(reject);
                        return;
                    }

                    const handler = this.getResponseHandlerForRoute(route);

                    if (!handler) {
                        res.status(500).json({
                            error: 'No response handler found for: ' + route.controller + ':' + route.action
                        });
                        stopwatchEvent && stopwatchEvent.stop();
                        reject();
                        return;
                    }

                    handler.onRenderResponse(req, res, data, status, (err, body) => {

                        if (err) {
                            // if there was an error during rendering, send it through the error handler
                            this.handleError(req, res, err).then(resolve).catch(reject);
                            stopwatchEvent && stopwatchEvent.stop();
                            return;
                        }

                        // kernel.post.response
                        container.get('event.dispatcher').dispatch(
                            'kernel.post.response',
                            {
                                request: req,
                                response: res,
                                error: null,
                                body: body,
                                status: status,
                                container: container
                            },
                            err => {
                                if (err) {
                                    this.handleError(req, res, err).then(resolve).catch(reject);
                                    stopwatchEvent && stopwatchEvent.stop();
                                    return;
                                }
                                handler.onSendResponse(req, res, data, body, status, err => {
                                    if (err) {
                                        this.handleError(req, res, err).then(resolve).catch(reject);
                                        stopwatchEvent && stopwatchEvent.stop();
                                        return;
                                    }
                                    stopwatchEvent && stopwatchEvent.stop();
                                    resolve();
                                });
                            }
                        );
                    });
                }
            );
        });
    }

    /**
     * Handle a redirect
     *
     * @param  {Object}    req
     * @param  {Object}    res
     * @param  {String}    location
     * @param  {Number}    status
     * @param  {Container} [container] the scoped service container, if any
     * @return {Promise}
     */
    handleRedirect(req, res, location, status = 302, container = null) {

        if (!container) {
            container = this.container;
        }

        const route = req.conga.route;

        return new Promise((resolve, reject) => {

            // kernel.error.response
            container.get('event.dispatcher').dispatch(
                'kernel.redirect.response',
                {
                    request: req,
                    response: res,
                    redirect: location,
                    container,
                    status
                },
                err => {

                    if (err) {
                        this.handleError(req, res, err, container).then(resolve).catch(reject);
                        return;
                    }

                    const handler = this.getResponseHandlerForRoute(route);

                    if (!handler) {
                        // if there is no handler, perform the redirect
                        res.redirect(status, location);
                        resolve();
                        return;
                    }

                    handler.onRedirectResponse(req, res, location, status, err => {
                        if (err) {
                            this.handleError(req, res, err, container).then(resolve).catch(reject);
                            return;
                        }
                        // kernel.post.response
                        container.get('event.dispatcher').dispatch(
                            'kernel.post.response',
                            {
                                request: req,
                                response: res,
                                redirect: location,
                                status,
                                container
                            },
                            err => {
                                if (err) {
                                    this.handleError(req, res, err, container)
                                        .then(resolve)
                                        .catch(reject);

                                    return;
                                }
                                handler.onSendRedirect(req, res, location, status, (err) => {
                                    if (err) {
                                        this.handleError(req, res, err, container)
                                            .then(resolve)
                                            .catch(reject);

                                        return;
                                    }
                                    resolve();
                                });
                            }
                        );
                    });
                }
            );
        });
    }

    /**
     * Handle an error response
     *
     * @param  {Object}                 req
     * @param  {Object}                 res
     * @param  {ErrorResponse|Error}    error
     * @param  {Container}              [container] the scoped service container, if any
     * @return {Promise}
     */
    handleError(req, res, error, container = null) {

        if (!container) {
            container = this.container;
        }

        const route = req.conga.route;

        return new Promise((resolve, reject) => {

            const handler = this.getResponseHandlerForRoute(route);

            if (!handler) {
                res.status(500).json({
                    error: 'No response handler found for: ' + route.controller + ':' + route.action,
                    previous: error.stack || error.message || error
                });
                reject();
                return;
            }

            const status = error.status || 500;

            if (!(error instanceof ErrorResponse)) {
                error = new ErrorResponse(
                    {
                        message: error.message,
                        originalError: error,
                        status,
                        stack: error.stack
                    },
                    status,
                    error.message || null,
                    error.headers || {}
                );
            }

            // kernel.error.response
            container.get('event.dispatcher').dispatch(
                'kernel.error.response',
                {
                    request: req,
                    response: res,
                    error: error,
                    container: container
                },
                err => {

                    if (err) {
                        container.get('logger').error(err.stack || err);
                    }

                    handler.onErrorResponse(req, res, error, (err, body) => {

                        if (err) {
                            container.get('logger').error(err.stack || err);
                        }

                        // kernel.post.response
                        container.get('event.dispatcher').dispatch(
                            'kernel.post.response',
                            {
                                request: req,
                                response: res,
                                error: error,
                                body: body,
                                status: status,
                                container: container
                            },
                            err => {
                                if (err) {
                                    res.status(500).json({
                                        error: err.stack || err.message || err,
                                        previous: error.stack || error.message || error
                                    });
                                    reject(err);
                                    return;
                                }
                                handler.onSendResponse(req, res, error, body, status, err => {
                                    if (err) {
                                        res.status(500).json({
                                            error: err.stack || err.message || err,
                                            previous: error.stack || error.message || error
                                        });
                                        reject(err);
                                        return;
                                    }
                                    resolve();
                                });
                            }
                        );
                    });
                }
            );
        });
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
        if (container.hasParameter('conga.response.handlers')) {
            const handlers = container.getParameter('conga.response.handlers');
            if (handlers &&
                route.controller in handlers &&
                route.action in handlers[route.controller]
            ) {
                return handlers[route.controller][route.action];
            }
        }

        return null;

    }

    /**
     * Boot up the express server
     *
     * @param  {Object} event
     * @param  {Function} next
     * @return {void}
     */
    onKernelServerBoot(event, next){

        try {

            const container = event.container;

            // start up HTTP server
            container.get('logger').debug('[conga-framework] - starting http server');
            container.get('express.server').listen(container.get('config').get('framework').app.port);
            container.get('logger').info('[conga-framework] - server started at http://' + container.get('config').get('framework').app.host + ':' + container.get('config').get('framework').app.port);

            next();

        } catch (e) {

            // something totally went wrong, so we shouldn't continue
            console.error(e.stack || e);
            process.exit();
        }
    }
}
