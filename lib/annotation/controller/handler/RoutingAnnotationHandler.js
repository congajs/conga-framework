/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// built-in modules
const path = require('path');
const url = require('url');

// third-party modules
const annotations = require('@conga/annotations');
const _ = require('lodash');

// local modules
const RouteAnnotation = require('../RouteAnnotation');
const Loader = require('../../../loader/Loader');

/**
 * The RoutingAnnotationHandler finds all routing annotations within the registered
 * controllers and configures routing information, etc. within the application
 * DIC container
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class RoutingAnnotationHandler {

    /**
     * Get the annotation paths that should be parsed
     *
     * @return {Array}
     */
    getAnnotationPaths() {
        return [
            path.join(__dirname, '..', 'RouteAnnotation')
        ];
    }

    /**
     * Handle all of the routing annotations on a controller
     *
     * @param {Container} container
     * @param {Reader}    reader
     * @param {Object}    controller
     *
     * @returns {void}
     */
    handleAnnotations(container, reader, controller) {

        // parse the routes from the controller
        const routes = this.parseRoutesFromFile(container, reader, controller);

        // make sure that container has routes array
        if (!container.hasParameter('conga.routes')) {
            container.setParameter('conga.routes', []);
        }

        // store routes for express to use later on
        container.setParameter(
            'conga.routes',
            container.getParameter('conga.routes').concat(routes.routes)
        );

        // make sure that container has response handlers hash
        if (!container.hasParameter('conga.response.handlers')) {
            container.setParameter('conga.response.handlers', {});
        }

        const handlers = container.getParameter('conga.response.handlers');

        for (let i in routes.routes) {

            const route = routes.routes[i];
            const controller = route.controller;
            const action = route.action;

            if (typeof handlers[controller] === 'undefined') {
                handlers[controller] = {};
            }

            if (typeof handlers[controller][action] === 'undefined') {
                handlers[controller][action] = {};
            }

            handlers[controller][action] = container.get('conga.json.response.handler');
        }

        container.setParameter('conga.response.handlers', handlers);

    }

    /**
     * Find the annotations in a controller and build all the routes based
     * on the annotation data
     *
     * @param {Container} container
     * @param {Reader}    reader
     * @param {Object}    controller
     *
     * @returns {Array}
     */
    parseRoutesFromFile(container, reader, controller) {

        // build the controller prototype
        const C = Loader.require(controller.filePath, controller.bundle);
        const _controller = new C();
        if (typeof _controller.setContainer === 'function') {
            _controller.setContainer(container);
        } else {
            _controller.container = container;
        }

        // add controller to container
        container.set(controller.serviceId, _controller);

        // set up return array
        const routes = [];
        //const websocketRoutes = [];

        // parse the annotations
        reader.parse(controller.filePath);

        // get the annotations
        const definitionAnnotations = reader.definitionAnnotations;
        const methodAnnotations = reader.methodAnnotations;
        //const hasWebsocket = false;

        let prefix = '/';

        // find constructor annotations
        definitionAnnotations.forEach(function(annotation) {

            // @Route annotation
            if (annotation instanceof RouteAnnotation) {
                prefix = annotation.value;
            }

        });

        // store prefix on controller data
        controller.prefix = prefix;

        // find method annotations
        methodAnnotations.forEach((annotation) => {

            // @Route annotation
            if (annotation instanceof RouteAnnotation) {

                let methods = annotation.methods;

                if (typeof methods === 'undefined' || methods === null) {
                    methods = ['GET'];
                }

                // loop through route methods [GET,POST,etc...]
                for (var x in methods) {

                    let path = (prefix + annotation.value)

                    if (path !== '//') {
                        path = path.replace('//', '/').replace(/\/+$/, ''); // hack to clean up weird concats
                    } else {
                        path = '/';
                    }

                    // parse any service injections from function
                    // example: myAction(req, res, $myService, $myOtherService)
                    const injectedServices = this.findInjectedServices(_controller, annotation.target);

                    // create the route configuration
                    const route = {
                        name: annotation.name,
                        controller: controller.serviceId,
                        action: annotation.target,
                        method: methods[x],
                        path: path,
                        filePath: controller.filePath,
                        injectedServices: injectedServices,
                        bodyParser: annotation.bodyParser || 'json',
                        controllerInfo: controller
                    };

                    routes.push(route);

                }
            }
        });

        return { routes: routes };
    }

    /**
     * Figure out if the controller method has any injected services
     * and return their alias names in an array
     *
     * @param  {Object} controller the controller instance
     * @param  {String} action     the action method name
     * @return {Array|null}
     */
    findInjectedServices(controller, action) {

        let params = controller[action].toString().match(/\(([^)]+)\)/)[1].split(',').map((p) => {
            return p.trim().replace('$', '');
        });

        if (params.length > 2) {
            return params.slice(2, params.length);
        }

        return null;
    }

}
