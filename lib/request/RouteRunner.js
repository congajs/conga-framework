/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * The RouteRunner handles running a controller/action for a route and any
 * pre-controller or filter listeners
 *
 * @author Marc Roulias <marc@lampjunkie.com
 */
module.exports = class RouteRunner {

    /**
     * Run the route for a request
     *
     * @param  {Container} container
     * @param  {Object}    route
     * @param  {Object}    req
     * @param  {Objet}     res
     * @return {void}
     */
    run(container, route, req, res) {

        container.get('logger').debug('[conga-framework] - request for: ' + route.path);

        // Look at config to see if request scoping is enabled.
        // if it does not exist it defaults to true.
        let scopeEnabled = true;

        const config = container.get('config').get('framework');
        if (typeof config.scope !== 'undefined' &&
            typeof config.scope.request !== 'undefined') {
            scopeEnabled = typeof config.scope.request === 'string' ?
                           config.scope.request == 'true' :
                           config.scope.request;
        }

        const createRequestScope = this.createRequestScope.bind(this);

        // add some conga stuff to the request
        req.conga = {
            route: route
        };

        const controller = container.get(route.controller);

        container.get('logger').debug('[conga-framework] - running controller: ' + route.controller + ':' + route.action);

        let scope;
        if (scopeEnabled) {
            scope = createRequestScope(controller, container, req, res);
        } else {
            scope = {
                container: container,
                controller: controller,
                req: Object.create(req),
                res: res
            }
        }

        // kernel.controller.pre_action
        scope.container.get('event.dispatcher').dispatch(
            'kernel.pre_controller',
            {
                container : scope.container,
                request : scope.req,
                response: scope.res,
                controller: scope.controller,
                action: route.action
            },
            function(){

                // run the pre filters
                scope.container.get('conga.filter.runner').run(
                    route.controller,
                    route.action,
                    'pre',
                    scope.req,
                    scope.res,
                    () => {

                        try {
                            if (typeof scope.controller[route.action] === 'function') {

                                // call the controller method
                                const result = scope.controller[route.action].call(scope.controller, scope.req, scope.res);

                                if (result instanceof Promise) {
                                    result.then((data) => {
                                        res.return(data);
                                    }).catch((error) => {
                                        res.error(error);
                                    });
                                }

                            } else {
                                scope.container.get('logger').error(route.controller + '.' + route.action + ' is not a function');
                                res.return({error: 'Internal Server Error'}, 500);
                            }
                        } catch (err){
                            scope.container.get('logger').error(err.stack);
                            res.return({error: 'Internal Server Error'}, 500);
                        }
                    }
                );
            }
        );

    }

    /**
     * Copy a service depending on its scope into a new container.
     * @param {Container} globalContainer the global container
     * @param {Container} scopedContainer the new container
     * @param {String} sid the service id.
     * @returns {Service}
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
     * @param req
     * @param res
     * @returns {{controller: ExpressListener.constructor, container: *}|{}}
     */
    createRequestScope(controller, container, req, res) {

        const self = this;

        // Create request scope for controller and container
        const _controller = Object.create(controller);

        const _container = container.copy();
        _container.__services = {};
        _container.set('service_container', _container);
        _container.set('config', container.get('config'));

        // Set the request and result object to the new container
        req = Object.create(req);

        res.__controller__ = _controller;

        _container.set('request', req);
        _container.setScope('request', 'request');
        _container.set('response', res);
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

        return {
            req,
            res,
            controller: _controller,
            container:_container
        };
    }

}
