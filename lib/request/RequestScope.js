/*
 * This file is part of the conga-framework module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * The request scope is used to encapsulate and document scoped data for a request
 */
class RequestScope {
    /**
     *
     * @param {Container}           container The scoped container
     * @param {Controller|Object}   controller The scoped controller
     * @param {Object}              request The scoped request object
     * @param {Object}              response The scoped response object
     * @param {Object}              route The scoped route
     */
    constructor(container, controller, request, response, route) {
        this.container = container;
        this.controller = controller;
        this.request = request;
        this.response = response;
        this.route = route;
    }
}

module.exports = RequestScope;