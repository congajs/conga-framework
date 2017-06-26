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
	 *
	 * @param  {Container} container
	 */
	constructor(container){

		this.container = container;

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
	 * Generate the relative url for a route
	 *
	 * @param  {Request} req
	 * @param  {String}  name
	 * @param  {Object}  params
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

		// figure out the host to use if ssl is required
		let host = '';

		if (includeHost){
			host = req.protocol + '://' + req.get('host')
		}

		return host + url;
	}

	/**
	 * Set the Routes
	 *
	 * @param routes
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
	getRouteByName(name){
		return this.routeHash[name];
	}

}
