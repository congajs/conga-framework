/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// local libs
const RequestScope = require('./../request/RequestScope');
const ErrorResponse = require('./../response/ErrorResponse');

/**
 * The RouteRunner handles running a controller/action for a route and any
 * pre-controller or filter listeners
 */
module.exports = class RouteRunner {

    /**
     * Run the route for a request
     *
     * @param  {Container} container The global service container
     * @param  {Object}    route
     * @param  {Object}    request
     * @param  {Object}    response
     * @return {void}
     */
    run(container, route, request, response) {

        let stopwatch, stopwatchEvent;
        if (container.has('profiler.stopwatch')) {
            stopwatch = container.get('profiler.stopwatch').request(request);
        }

        container.get('logger').debug(
            '[conga-framework] - request: ' + request.method + ' ' + route.path);

        // add some conga stuff to the request
        request.conga = { route };

        const controller = container.get(route.controller);

        container.get('logger').debug(
            '[conga-framework] - running controller: ' + route.controller + ':' + route.action);

        stopwatchEvent = stopwatch && stopwatch.section('request.scope').start();

        this.initializeRequestScope(container, controller, request, response, route, (err, scope) => {

            if (err) {
                container.get('logger').error(err.stack || err);
            }

            stopwatchEvent && stopwatchEvent.stop();

            // kernel.controller.pre_action
            scope.container.get('event.dispatcher').dispatch(
                'kernel.pre_controller',
                {
                    container: scope.container,
                    request: scope.request,
                    response: scope.response,
                    controller: scope.controller,
                    action: scope.route.action
                },
                err => {

                    if (err) {
                        container.get('logger').error(err.stack || err);
                    }

                    let stopwatch;
                    if (scope.container.has('profiler.stopwatch')) {
                        stopwatch = scope.container.get('profiler.stopwatch')
                            .request(scope.request, 'kernel.controller');
                        stopwatch.start();
                    }

                    // run the pre filters
                    scope.container.get('conga.filter.runner').run(
                        route.controller,
                        route.action,
                        'pre',
                        scope.request,
                        scope.response,
                        err => {

                            if (err) {
                                container.get('logger').error(err.stack || err);
                            }

                            stopwatch && stopwatch.start(
                                route.controller + ':' + route.action, 'controller.action');

                            this.runControllerInScope(scope, (err, response) => {
                                if (err) {
                                    container.get('logger').error(err.stack || err);
                                }
                                stopwatch && stopwatch.ensureStopped();
                            });
                        }
                    );
                }
            );
        });

    }

    /**
     * Execute a controller action from a given request scope
     * @param {RequestScope} scope The request scope object
     * @param {Function} cb
     */
    runControllerInScope(scope, cb) {
        try {
            if (typeof scope.controller[scope.route.action] === 'function') {

                const actionArgs = [scope.request, scope.response];

                if (scope.route.injectedServices !== undefined &&
                    scope.route.injectedServices !== null
                ) {
                    scope.route.injectedServices.forEach((alias) => {
                        actionArgs.push(scope.container.get(alias));
                    });
                }

                // call the controller method
                const result = scope.controller[scope.route.action].apply(
                    scope.controller,
                    actionArgs
                );

                if (result instanceof Promise) {
                    result.then(data => {
                        scope.response.return(data);
                        cb(null, result);
                    }).catch(err => {
                        scope.response.error(err);
                        cb(err, result);
                    });
                } else {
                    cb(null, result);
                }

            } else {
                scope.container.get('logger').error(
                    scope.route.controller + '.' + scope.route.action + ' is not a function');

                let err = new ErrorResponse({error: 'Internal Server Error'}, 500);
                scope.response.error(err);
                cb(err, err);
            }
        } catch (err) {
            let result = new ErrorResponse({
                error: 'Internal Server Error',
                originalError: err
            }, 500);
            scope.container.get('logger').error(err.stack || err);
            scope.response.error(result);
            cb(err, result);
        }
    }

    /**
     * Initialize the request scope
     * @param {Container}           container The global service container
     * @param {Controller|Object}   controller
     * @param {Object}              request
     * @param {Object}              response
     * @param {Object}              route
     * @param {Function}            cb
     */
    initializeRequestScope(container, controller, request, response, route, cb) {

        // look at config to see if request scoping is enabled.
        // if it does not exist it defaults to true.
        let scopeEnabled = true;

        const config = container.get('config').get('framework');
        if (typeof config.scope !== 'undefined' &&
            typeof config.scope.request !== 'undefined'
        ) {
            scopeEnabled = typeof config.scope.request === 'string' ?
                config.scope.request === 'true' :
                config.scope.request;
        }

        if (scopeEnabled) {
            const scope = this.createRequestScope(controller, container, request, response, route);
            // enhance response again with the new scoped container to preserve the scope through the response
            container.get('conga.express.listener').enhanceResponse(scope.request, scope.response, () => {
                // dispatch an event that we have created a new request scope
                scope.container.get('event.dispatcher').dispatch(
                    'kernel.request_scope',
                    {
                        globalContainer: container,
                        container: scope.container,
                        request: scope.request,
                        response: scope.response,
                        controller: scope.controller,
                        action: scope.route.action
                    },
                    err => {
                        // execute our callback
                        cb(err, scope);
                    }
                );
            }, scope.container);
        } else {
            cb(null, new RequestScope(
                container,
                controller,
                Object.create(request),
                response,
                route
            ));
        }
    }

    /**
     * Copy a service depending on its scope into a new container.
     * @param {Container} globalContainer the global container
     * @param {Container} scopedContainer the new container
     * @param {String} sid the service id.
     * @returns {Object} The service instance
     */
    copyServiceIntoScope(globalContainer, scopedContainer, sid) {
        // We are reaching in and using the __services member of the container directly
        // since the scoping operation overrides get and will blow the stack if used.

        let service = scopedContainer.__services[sid];

        if (service) {
            return service;
        }

        const scope = globalContainer.getScope(sid).toLowerCase();

        switch (scope) {
            default :
                // Just copy the service instance in the global container
                scopedContainer.__services[sid] = globalContainer.__services[sid];
                return scopedContainer.__services[sid];

            case 'request' :
                service = this._copyServiceIntoRequestScope(globalContainer, scopedContainer, sid);
                break;
        }

        if (service) {
            service.__scope__ = scope;
        }

        return service;
    }

    /**
     * Copy a the service into the request scope (should probably move this some factory or something)
     * @param {Container} globalContainer the global container
     * @param {Container} scopedContainer the new container
     * @param {String} sid the service id.
     * @returns {Service|null}
     * @private
     */
    _copyServiceIntoRequestScope(globalContainer, scopedContainer, sid) {

        const _proto = globalContainer.__services[sid];

        if (!(_proto instanceof Object)) {
            return null;
        }

        // Parse constructor arguments and apply
        const definition = globalContainer.__definitions[sid];
        const sidReg = /^@/;

        let args = [];

        if (definition.hasArguments()) {
            const defArgs = definition.getArguments();
            for (let arg of defArgs) {
                if (typeof arg === 'string' && arg[0] === '@') {
                    let _sid = arg.replace(sidReg, '');
                    arg = scopedContainer.__services[_sid];
                    if (!arg) {
                        arg = this.copyServiceIntoScope(globalContainer, scopedContainer, _sid);
                    }
                }
                if (arg) {
                    args.push(arg);
                }
            }
        }

        const service = new _proto.constructor(...args);

        // Check and call methods
        if (definition.hasCalls()) {
            let calls = definition.getCalls();
            for (let call of calls) {
                args = [];
                for (let arg of call.arguments) {
                    if (typeof arg === 'string' && arg[0] === '@') {
                        let _sid = arg.replace(sidReg, '');
                        arg = scopedContainer.__services[_sid];
                        if (!arg) {
                            arg = this.copyServiceIntoScope(globalContainer, scopedContainer, _sid);
                        }
                    }
                    if (arg) {
                        args.push(arg);
                    }
                }

                // call the service method
                service[call.method].apply(service, args);
            }
        }

        scopedContainer.__services[sid] = service;

        return service;
    }

    /**
     * Create a request scope. If specified a a service in request scope
     * will have a new instance for the life of the request.
     *
     * @param controller
     * @param container
     * @param request
     * @param response
     * @param route
     * @returns {RequestScope}
     */
    createRequestScope(controller, container, request, response, route) {

        const self = this;

        // Create request scope for controller and container
        const _controller = Object.create(controller);

        const _container = container.copy();
        _container.__services = {};
        _container.set('service_container', _container);
        _container.set('config', container.get('config'));

        // add a 'global' getter to be able to reference the global container
        Object.defineProperty(_container, 'global', { get: () => { return container; }});

        // Set the request and result object to the new container
        request = Object.create(request);

        response.__controller__ = _controller;

        _container.set('request', request);
        _container.setScope('request', 'request');
        _container.set('response', response);
        _container.setScope('response', 'request');

        // Set the new container to the controller
        _controller.container = _container;

        // Override the get service parameter.
        // Return a new service instance at the request scope.
        _container.get = function(id) {
            return self.copyServiceIntoScope(container, this, id);
        };

        // Override has - look in scoped container and if not there look into global.
        _container.has = function(id) {
            if (this.__services[id] !== undefined) {
                return true;
            }
            return container.has(id);
        };

        return new RequestScope(
            _container,
            _controller,
            request,
            response,
            route
        );
    }

    /**
     * Destroy the request scope
     *
     * @param request
     * @param response
     * @param container
     * @param cb
     * @returns {void}
     */
    destroyRequestScope(request, response, container, cb) {
        // dispatch an event that we are about to destroy the request scope
        container.get('event.dispatcher').dispatch(
            'kernel.request_scope.destroy',
            {container, request, response},
            err => {
                // clean up request scope
                if (response.__controller__ !== undefined) {
                    delete response.__controller__.container;
                }
                // execute our callback
                cb(err);
            }
        );
    }

};
