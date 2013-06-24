/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// built-in modules
var fs = require('fs');
var path = require('path');

// third-party modules
var _ = require('lodash');
var async = require('async');
var express = require('express');

// local modules
var TagSorter = require('../ioc/tag-sorter');

/**
 * The ExpressListener configures and starts an express
 * server during the various kernel lifecycle events
 *
 * @author  Marc Roulias <marc@lampjunkie.com>
 */
var ExpressListener = function(){
	this.templatePathCache = {};
};

ExpressListener.prototype = {

	/**
	 * Hash to store namespaced template paths to their
	 * real file paths
	 * 
	 * @type {Object}
	 */
	templatePathCache: {},

	/**
	 * Initialize express when the kernel boots up
	 * 
	 * @param {Object} event
	 * @param {Function} next
	 */
	onKernelBoot: function(event, next){

		var that = this;
		var container = event.container;

		container.get('logger').debug('initializing express');

		this.initializeExpress(container, function(){
			that.registerRoutes(container);
			next();
		});
	},
	
	/**
	 * Register all of the middleware
	 * 
	 * @param  {Object}   event
	 * @param  {Function} next
	 * @return {void}
	 */
	onKernelRegisterMiddleware: function(event, next){

		var self = this;
		var container = event.container;
		var app = container.get('express.app');

		container.get('logger').debug('registering express middleware');

		// register middleware
		this.registerMiddleware(container, function(){
	
			// register public asset paths
			self.registerPublicPaths(container);

			// 400 errors
			app.use(function(req, res, next){

				// create route on request
				req.conga = {
					route: {
						controller: 'exception',
						action: 'error404'
					}
				};

				self.handleTemplateResponse(req, res, {}, 400);
			});

			// 500 errors
			app.use(function(err, req, res, next) {

				container.get('logger').error(err);

				// create route on request
				req.conga = {
					route: {
						controller: 'exception',
						action: 'error500'
					}
				};

				self.handleTemplateResponse(req, res, {}, 500);
			});

			// register all of the view engines
			self.registerViewEngines(container, app, function(){
				next();		  
			});			
		});
	},

	/**
	 * Initialize the express app
	 * 
	 * @param container
	 */
	initializeExpress: function(container, next){

		var that = this;

		// create the express app
		var app = express();

		this.container = container;

		container.set('express', express);

		// store express app in the container
		container.set('express.app', app);	

		// create http server
		var httpServer = require('http').createServer(app);
		container.set('express.server', httpServer);

		// SSL
		var sslConfig = container.get('config').get('ssl');

		if (sslConfig.enabled === true){
			
			var options = {
				key: fs.readFileSync(path.join(container.getParameter('kernel.app_path'), 'resources', 'ssl', sslConfig.key)),
				cert: fs.readFileSync(path.join(container.getParameter('kernel.app_path'), 'resources', 'ssl', sslConfig.cert)),
				ca: sslConfig.ca,
				rejectUnauthorized: false	
			};

			var httpsServer = require('https').createServer(options, app);
			container.set('express.server.https', httpsServer);
		}

		var config = container.get('config').get('express');

		// set express settings
		app.set('view cache', config.view.cache);

		// add some middleware to enhance request and response
		app.use(this.enhanceRequest.bind(this));
		app.use(this.enhanceResponse.bind(this));

		app.use(express.bodyParser());
		app.use(express.cookieParser());

		this.registerSession(container, app);

		this.registerControllerListeners(container);

		// register template helpers
		this.registerTemplateHelpers(container, app);

		next();
	},

	/**
	 * Register the controller listeners
	 * 
	 * @param  {Container} container
	 * @return {void}
	 */
	registerControllerListeners: function(container){

		var tags = container.getTagsByName('kernel.pre_controller');

		if (!tags){
			return;
		}
		
		tags.forEach(function(tag){
			container.get('event.dispatcher').addListener(
					'kernel.pre_controller', 
					container.get(tag.getServiceId()), 
					tag.getParameter('method'));
		});
	},

	/**
	 * Enhance the request
	 *
	 * @param {Object} req
	 * @param {Object} res
	 * @param {Function} next
	 */
	enhanceRequest: function(req, res, next){
		//req.conga = {
		//	container: this.container
		//};
		next();
	},

	/**
	 * Enhance the request
	 *
	 * @param {Object} req
	 * @param {Object} res
	 * @param {Function} next
	 */
	enhanceResponse: function(req, res, next){

		var that = this;
		var templates = this.container.getParameter('conga.templates');

		// generic return method for views, json, and websockets
		res.return = function(data){

			var route = req.conga.route;

			// run the post filters
			that.container.get('conga.filter.runner').run(
				route.controller,
				route.action,
				'post',
				req,
				res,
				function(){

					if (typeof templates[route.controller] !== 'undefined' &&
						typeof templates[route.controller][route.action] !== 'undefined'){
						that.handleTemplateResponse(req, res, data);
					} else {
						that.handleJsonResponse(req, res, data);
					}
				}
			);
		};

		// generic exception method for views, json, and websockets
		res.error = function(error){
			this.responseError = error;
		}

		next();
	},
	
	/**
	 * Configure the session info, store, etc. on express
	 * 
	 * @param  {Container} container
	 * @param  {Object}    app
	 * @return {void}
	 */
	registerSession: function(container, app){

		// set the default config
		var defaults = {
			key: 'conga.sid',
			secret: 'keyboardcat',
			cookie_name: 'congajs',
			lifetime: 3600,
			store: 'memory'
		};

		var config = container.getParameter('app.session');

		// merge config with defaults
		config = _.merge(defaults, config);

		var storePath = path.join(
			container.getParameter('kernel.project_path'),
			'node_modules',
			config.store.type
		);
		var store = require(storePath)(express);

		var storeObject = new store(config.store.options);

		container.set('session.store', storeObject);

		app.use(express.session({ 
			key: config.key,
			secret: config.secret,
			maxAge: new Date(Date.now() + config.lifetime),
			store: storeObject
		}));
	},

	/**
	 * Find all of the registered middleware tags and register them
	 * 
	 * @param  {Container} container
	 * @return {void}
	 */
	registerMiddleware: function(container, done){

		var tags = container.getTagsByName('app.middleware');

		// sort tags by priority
		TagSorter.sortByPriority(tags);

		var calls = [];

		for (var i in tags){
			var tag = tags[i];

			(function(tag){
				calls.push(
					function(callback){
						var service = container.get(tag.getServiceId());
						var method = tag.getParameter('method');

						service[method].call(service, container, container.get('express.app'), callback);
					}
				);
			}(tag));
		}

		// run the events!
		async.series(calls, function(err, results){
			done();
		});
	},

	/**
	 * Find all of the tagged view engines and register them
	 * 
	 * @param {Container} container
	 * @param {Application} app
	 * @param {Function} cb
	 * @returns {void}
	 */
	registerViewEngines: function(container, app, cb){
	  
		var tags = container.getTagsByName('app.view.configuration');

		// just using one registered tag for now
		// not sure if there would ever be a case for using more...
		var tag = tags[0];

		var service = container.get(tag.getServiceId());
		var method = tag.getParameter('method');

		service[method].call(service, container, app, cb);
	},
	
	/**
	 * Find all the tagged template helpers and register them
	 * 
	 * @param {Container} container
	 * @param {Application} app
	 * @param {Function} cb
	 * @returns {void}
	 */
	registerTemplateHelpers: function(container, app, cb){
	  
		var tags = container.getTagsByName('template.helper');
		var helpers = {};

		for (var i in tags){
			var helper = container.get(tags[i].getServiceId());
			for (var method in helper.methods){
				helpers[method] = helper[helper.methods[method]].bind(helper);
			}
		}

		app.use(function(req, res, next){
			res.locals = _.merge(res.locals, helpers);
			next();
		});
	},
	
	/**
	 * Register the public directories
	 * 
	 * @param container
	 */
	registerPublicPaths: function(container){

		var bundles = container.getParameter('app.bundles');

		bundles.push('conga-framework');

		bundles.forEach(function(bundle){
	
			var dir = path.join(container.get('namespace.resolver').resolve(bundle), 'public');

			if (!fs.existsSync(dir)){
				return;
			}

			// make sure that there's a public bundle directory
			var publicBundlePath = path.join(container.getParameter('kernel.app_public_path'), 'bundles');
			if (!fs.existsSync(publicBundlePath)){
				fs.mkdirSync(publicBundlePath);
			}
			
			// create a symlink to the public path for the bundle
			var publicPath = path.join(container.getParameter('kernel.app_public_path'), 'bundles', bundle);
			if (!fs.existsSync(publicPath)){
				fs.symlinkSync(dir, publicPath);
			}
		});
		
		// register the main public path
		container.get('express.app').use(require('express').static(container.getParameter('kernel.app_public_path')));
	},
	
	/**
	 * Register the routes on the express app
	 * 
	 * @param {Container} container
	 */
	registerRoutes: function(container){

		var self = this;
		var app = container.get('express.app');
		var routes = container.getParameter('conga.routes');
		var controller;
		var verb;

		if (typeof routes == 'undefined' || routes.length == 0){
			throw new Error('no routes are defined!');
		}

		// add routes and SSL rules to the Router
		container.get('router').setRoutes(routes);
		container.get('router').setSSLRules(container.getParameter('conga.controller.ssl'));

		// register each route
		routes.forEach(function(route){

			(function(container, route){

				// register the route
				verb = route.method.toLowerCase();
				
				// add the express verb action
				app[verb](route.path, function(req, res){

					var run = function(){

						// add some conga stufff to the request
						req.conga = {
							route: route
						};

						// get the controller instance
						controller = container.get(route.controller);

						// kernel.controller.pre_action
						container.get('event.dispatcher').dispatch(
							'kernel.pre_controller', 
							{
								container : container, 
								request : req, 
								response: res, 
								controller: route.controller, 
								action: route.action
							}, 
							function(){
								// run the pre filters
								container.get('conga.filter.runner').run(
									route.controller,
									route.action,
									'pre',
									req,
									res,
									function(){
										// call the controller method
										controller[route.action].call(controller, req, res);
									}
								);
							}
						);
					};

					// check if we need to run the ssl check
					if (container.get('config').get('ssl').enabled === true
						&& (typeof container.getParameter('conga.controller.ssl')[route.controller] !== 'undefined'
						&& container.getParameter('conga.controller.ssl')[route.controller] === '*'
						|| (typeof container.getParameter('conga.controller.ssl')[route.controller] !== 'undefined'
						&&	typeof container.getParameter('conga.controller.ssl')[route.controller][route.action] !== 'undefined'
						))){

						// run the ssl handler
						container.get(container.get('config').get('ssl').handler)
							.run(container, req, res, function(){
								run();
							});

					} else {
						run();
					}

				});
				
			})(container, route);
		});
	},

	/**
	 * Handle a template response
	 * 
	 * @param  {Object} req
	 * @param  {Object} res
	 * @param  {Object} data
	 * @return {void}
	 */
	handleTemplateResponse: function(req, res, data, status){

		// make sure we have a status if one wasn't passed in
		if (typeof status === 'undefined'){
			status = 200;
		}

		var container = this.container;
		var route = req.conga.route;

		// find the template
		var template = container.getParameter('conga.templates')[route.controller][route.action];

		this.findTemplatePath(container, template, function(templatePath){

			// render the template with the registered view engine
			res.render(templatePath, data, function(err, renderedBody){

			// set the final body on the response
			res.body = renderedBody;

			// kernel.response
			container.get('event.dispatcher').dispatch(
				'kernel.response', {
				request : req, response : res, body: data, container : container },
				function(){

					if (err) return req.next(err);

					// set headers
					res.setHeader('X-Powered-By', container.getParameter('response.x-powered-by'));
					res.setHeader('Content-Type', 'text/html');
					res.setHeader('Content-Length', res.body.length);

					// send final request
					res.send(status, res.body);
				});
			});
		});
	},

	/**
	 * Find the real template path for a given template object
	 *
	 * This method checks if there is a template override for a template
	 * within app/resources/[bundle-name]/[template-path]
	 * and uses it, otherwise it finds the template from the actual bundle
	 * 
	 * @param  {Object}   container
	 * @param  {Object}   template
	 * @param  {Function} cb
	 * @return {void}
	 */
	findTemplatePath: function(container, template, cb){

		var self = this;

		// check if path is already cached
		if (typeof this.templatePathCache[template.namespace] === 'undefined'){

			// check if there is an override in the app/resources directory
			var appPath = path.join(
				container.getParameter('kernel.app_path'), 
				'resources', 
				container.get('namespace.resolver').injectSubpath(template.namespace, 'view').replace(':', '/')
					+ '.' + container.getParameter('app.view.engine')
			);

			fs.exists(appPath, function(exists){

				if (exists){
					self.templatePathCache[template.namespace] = appPath;
				} else {
					self.templatePathCache[template.namespace] = 
						container.get('namespace.resolver').resolveWithSubpath(
			  			template.namespace + '.' + container.getParameter('app.view.engine'), 'lib/view');
				}

				// use the cached path
				cb(self.templatePathCache[template.namespace]);
				return;
			});

		} else {

			// use the cached path
			cb(this.templatePathCache[template.namespace]);
		}
	},

	/**
	 * Handle a json response
	 * 
	 * @param  {Object} req
	 * @param  {Object} res
	 * @param  {Object} data
	 * @return {void}
	 */
	handleJsonResponse: function(req, res, data){
		res.json(data);
	},

	/**
	 * Boot up the express server
	 * 
	 * @param {Object} event
	 * @param {Function} next
	 */
	onKernelServerBoot: function(event, next){

		try {

			var container = event.container;

			// start up HTTP server
			container.get('logger').debug('starting http server');
			container.get('express.server').listen(container.getParameter('app.config').port);

			// start up HTTPS server (if it's enabled in the config)
			var sslConfig = container.get('config').get('ssl');

			if (sslConfig.enabled === true){
				container.get('logger').debug('starting https server');
				container.get('express.server.https').listen(sslConfig.port);
			}

			next();

		} catch (e){

			// something totally went wrong, so we shouldn't continue
			console.log(e);
			process.exit();
		}
	}	
};

module.exports = ExpressListener;