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
     *
     * @param {Container} the global container
     * @param {Container} the new container
     * @param {String} the service id.
     *
     * @return {Service}
     */
    copyServiceIntoScope(globalContainer, scopedContainer, sid) {
        // We are reaching in and using the __services member of the container directly
        // since the scoping operation overrides get and will blow the stack if used.
        var self = this;
        var service = scopedContainer.__services[sid];
        if (!service) {
            var scope = globalContainer.getScope(sid);
            if (scope == 'request'){
                var _proto = globalContainer.__services[sid];
                if (_proto) {

                    service = Object.create(_proto);

                    // Parse constructor arguments and apply
                    var definition = globalContainer.__definitions[sid];
                    var args = [];
                    if (definition.hasArguments()) {
                        var defArgs = definition.getArguments();
                        for(var i=0, j=defArgs.length; i<j; i++){
                            var a = defArgs[i];
                            if(typeof a == 'string' && a[0] == '@'){
                                var _sid = a.replace('@', '');
                                var arg = scopedContainer.__services[_sid];
                                if (!arg){
                                    arg = self.copyServiceIntoScope(globalContainer, scopedContainer, _sid);
                                }
                                args.push(arg);
                            } else {
                                args.push(a);
                            }
                        }
                    }
                    // Call constructor
                    service.constructor.apply(service, args);

                    // Check and call methods
                    if(definition.hasCalls()){
                        var calls = definition.getCalls();
                        for(var i = 0, j = calls.length; i < j; i++){
                            var method = calls[i].method;
                            var callArgs = [];
                            for(var x=0, y=calls[i].arguments.length; x < y; x++){
                                if(typeof calls[i].arguments[x] == 'string' && calls[i].arguments[x][0] == '@'){
                                    var _sid = calls[i].arguments[x].replace('@', '');
                                    var arg = scopedContainer.__services[_sid];
                                    if (!arg){
                                        arg = self.copyServiceIntoScope(globalContainer, scopedContainer, _sid);
                                    }
                                    callArgs.push(arg);
                                } else {
                                    callArgs.push(calls[i].arguments[x]);
                                }
                            }
                            // Apply method
                            service[method].apply(service, callArgs);
                        }
                    }

                    scopedContainer.__services[sid] = service;
                }
            } else {

                // Just copy the service instance in the global container
                service = globalContainer.__services[sid];
                scopedContainer.__services[sid] = service;
            }

            if (service) {
                service.__scope__ = scope;
            }
        }

        return service;
    }

    /**
     * Create a request scope. If specified a a service in request scope
     * will have a new instance for the life of the request.
     *
     * @param controller
     * @param container
     * @returns {{controller: ExpressListener.constructor, container: *}}
     */
    createRequestScope(controller, container, req, res) {

        var self = this;

        // Create request scope for controller and container
        var _controller = Object.create(controller);

        var _container = container.copy();
        _container.__services = {};
        _container.set('service_container', _container);
        _container.set('config', container.get('config'));

        // Set the request and result object to the new container
        var _req = Object.create(req);
        res.__controller__ = _controller;
        _container.set('request', _req);
        _container.setScope('request', 'request');
        _container.set('response', res);
        _container.setScope('response', 'request');

        // Set the new container to the controller
        _controller.container = _container;

        const copyServiceIntoScope = this.copyServiceIntoScope;

        // Override the get service parameter. Return
        // a new service instance at the request scope.
        _container.get = function(id){
            return copyServiceIntoScope(container, this, id);
        }

        // Override has - look in scoped container and if not there look into
        // global.
        _container.has = function(id){
            var r = typeof this.__services[id] !== 'undefined';
            if (!r) {
                r = container.has(id);
            }
            return r;
        }

        return {
            controller: _controller,
            container:_container,
            req: _req,
            res: res
        };
    }

}
