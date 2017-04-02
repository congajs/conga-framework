/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * The Router handles the generation of urls from
 * route names
 * 
 * @author  Marc Roulias <marc@lampjunkie.com>
 */
var WebsocketRouter = function(container){
	this.container = container;
	this.routes = [];
	this.routeHash = {};
};

WebsocketRouter.prototype = {
		
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

		return null;
	},
	
	/**
	 * Set the Routes
	 * 
	 * @param routes
	 */
	setRoutes: function(routes){

		if (typeof routes !== 'undefined'){
			this.routes = routes;

			this.routes.forEach(function(route){
				route.isSSL = false;
				this.routeHash[route.name] = route;
			}, this);			
		}
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

module.exports = WebsocketRouter;