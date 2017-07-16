/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const querystring = require('querystring');

/**
 * The Router handles the generation of urls from
 * route names
 *
 * @author  Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class Router {

	/**
	 * Construct the router
	 */
	constructor() {

		/**
		 * Array of Routes
		 *
		 * @var {Array}
		 */
		this.routes = [];

		/**
		 * Hash of (route name => Route)
		 *
		 * @var {Object}
		 */
		this.routeHash = {};
	}

	/**
	 * Generate the url for a given route name
	 *
	 * @param  {Request} req          the request
	 * @param  {String}  name         the route name
	 * @param  {Object}  params       hash of url/querystring params
	 * @param  {Boolean} includeHost  should the host be included?
	 * @return {String}
	 */
	generateUrl(req, name, params, includeHost = false){

		if (typeof this.routeHash[name] === 'undefined') {
			throw new Error('Route not found: ' + name);
		}

		const route = this.routeHash[name];
		const qs = {};
		let url = route.path;
		let pattern;

		// build the parameters
		// this will either build a path if there are named parameters in the route
		// or convert unknown parameters to a querstring
		if (params !== null && typeof params === 'object') {

			Object.keys(params).forEach((i) => {

				if (i === '_keys') {
					return;
				}

				pattern = ':' + i;
				if (url.indexOf(pattern) !== -1) {
					url = url.replace(pattern, params[i]);
				} else {
					qs[i] = params[i];
				}
			});

			if (Object.keys(qs).length > 0) {
				url = url + '?' + querystring.stringify(qs);
			}
		}

		let host = '';

		if (includeHost){
			host = req.protocol + '://' + req.get('host')
		}

		return host + url;
	}

	/**
	 * Set the Routes
	 *
	 * @param  routes
	 * @return {void}
	 */
	setRoutes(routes) {

		this.routes = routes;

		this.routes.forEach((route) => {
			this.routeHash[route.name] = route;
		});
	}

	/**
	 * Get a route by name
	 *
	 * @param  {String} name
	 * @return {Object}
	 */
	getRouteByName(name) {
		return this.routeHash[name];
	}

}
