/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// built-in modules
var querystring = require('querystring');

/**
 * The Router handles the generation of urls from
 * route names
 * 
 * @author  Marc Roulias <marc@lampjunkie.com>
 */
var Router = function(container){
	this.container = container;
	this.routes = [];
	this.routeHash = {};


};

Router.prototype = {
		
	/**
	 * Array of Routes
	 * 
	 * @var {Array}
	 */
	routes: [],
		
	/**
	 * Hash table of (route name => Route)
	 * 
	 * @var {Object}
	 */
	routeHash: {},
		
	/**
	 * Generate the relative url for a route
	 * 
	 * @param {String} name
	 * @param {Object} params
	 * @return {String}
	 */	
	generateUrl: function(name, params){

		var route = this.routeHash[name];
		var url = route.path;
		var qs = {};
		var pattern;

		if (typeof this.sslConfig === 'undefined'){
			this.sslConfig = this.container.get('config').get('framework').ssl;
		}

		// build the parameters
		// this will either build a path if there are named parameters in the route
		// or convert unknown parameters to a querstring
		if (typeof params == 'object'){
			for (var i in params){
				pattern = ':' + i;
				if (url.indexOf(pattern) !== -1){
					url = url.replace(pattern, params[i]);	
				} else {
					qs[i] = params[i];
				}
			}
			
			if (Object.keys(qs).length > 0){
				url = url + '?' + querystring.stringify(qs);
			}
		}

		// figure out the host to use if ssl is required
		var host = '';

		if (route.isSSL){
			host = 'https://' + this.sslConfig.host;
		}
		
		return host + url;
	},
	
	/**
	 * Set the Routes
	 * 
	 * @param routes
	 */
	setRoutes: function(routes){

		this.routes = routes;

		this.routes.forEach(function(route){
			route.isSSL = false;
			this.routeHash[route.name] = route;
		}, this);
	},

	/**
	 * Set the SSL Routing rules
	 * 
	 * @param  {Object} rules
	 * @return {void}
	 */
	setSSLRules: function(rules){

		for (var i in this.routeHash){

			var route = this.routeHash[i];

			if (typeof rules[route.controller] !== 'undefined'){
				if (typeof rules[route.controller]['*'] !== 'undefined' ||
					typeof rules[route.controller][route.action] !== 'undefined'){
					route.isSSL = true;
				}
			}
		}
	},

	/**
	 * Get a route by name
	 * 
	 * @param  {String} name
	 * @return {Object}
	 */
	getRouteByName: function(name){
		return this.routeHash[name];
	}
};

module.exports = Router;