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
var http = require('http');
var path = require('path');

// third-party modules
var _ = require('lodash');
var async = require('async');
var express = require('express');
var HttpStatus = require('http-status');

// local modules
var TagSorter = require('../ioc/tag-sorter');

/**
 * The ExpressListener configures and starts an express
 * server during the various kernel lifecycle events
 *
 * @author  Marc Roulias <marc@lampjunkie.com>
 */
function ExpressListener(){
	this.templatePathCache = {};
}

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
	
			// 400 errors
			app.use(function(req, res, next){

				// create route on request
				req.conga = {
					route: {
						controller: 'exception',
						action: 'error404'
					}
				};

				if (req.isJson()){
					self.handleJsonResponse(req, res, { message : 'Invalid path: ' + req.url }, 404);
				} else {
					self.handleTemplateResponse(req, res, {}, 404);
				}
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

				if (req.isJson()){
					self.handleJsonResponse(req, res, { message : 'Internal error' }, 500);
				} else {
					self.handleTemplateResponse(req, res, {}, 500);					
				}

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
		var sslConfig = container.get('config').get('framework').ssl;

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

		var config = container.get('config').get('framework').express;

		// set express settings
		app.set('view cache', config.view.cache);

		// add some middleware to enhance request and response
		//app.use(this.enhanceRequest.bind(this));
		app.use(this.enhanceResponse.bind(this));

		// pre-register middleware (this gives you a chance to register middleware with high priority before anything else)
		this.preRegisterMiddleware(container, function() {

			app.use(function(req, res, next) {
				if (req.method === 'OPTIONS') {
					// kernel.pre_flight_request
					container.get('event.dispatcher').dispatch(
						'kernel.pre_flight_request',
						{
							container : container,
							request : req,
							response: res
							//route: req.conga.route
						},
						function(){
							// empty
						}
					);
				} else {
					next();
				}
			});

			app.use(express.urlencoded());
			app.use(express.json());
			app.use(express.cookieParser());

			that.registerSession(container, app);

			that.registerPreFlightListeners(container);

			that.registerControllerListeners(container);

			// register template helpers
			that.registerTemplateHelpers(container, app);

			// register public asset paths
			that.registerPublicPaths(container);

			// extend the request
			http.IncomingMessage.prototype.isJson = function(){
				return this.headers['content-type'] == 'application/json';
			};

			// add status code methods to response (i.e. req.OK(), req.UNAUTHORIZED(), etc...)
			for (var i in HttpStatus){

				var num = parseInt(HttpStatus[i]);

				if (num >= 100){
					(function(name, status){
						http.ServerResponse.prototype[name] = function(msg){
							that.handleJsonResponse(null, this, msg, status);
						};
					}(i, num));
				}
			}

			next();

		});
	},

	/**
	 * Register the pre_flight_request listeners
	 *
	 * @param  {Container} container
	 * @return {void}
	 */
	registerPreFlightListeners: function(container){

		var tags = container.getTagsByName('kernel.pre_flight_request');

		if (!tags){
			return;
		}

		tags.forEach(function(tag){
			container.get('event.dispatcher').addListener(
				'kernel.pre_flight_request',
				container.get(tag.getServiceId()),
				tag.getParameter('method'));
		});
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
	enhanceResponse: function(req, res, next){

		var that = this;
		var templates = this.container.getParameter('conga.templates');

		// generic return method for views, json, and websockets
		res.return = function(data, code){

			if (typeof code === 'undefined' || code === null){
				code = 200;
			}

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
						that.handleJsonResponse(req, res, data, code);					
					}
				}
			);
		};

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
			enabled: true,
			key: 'conga.sid',
			secret: 'keyboardcat',
			cookie_name: 'congajs',
			lifetime: 3600,
			store: 'memory'
		};

		var config = container.get('config').get('framework').session;

		// merge config with defaults
		config = _.merge(defaults, config);

		if (config.enabled === true){

			var storeObject;

			if (config.store.type === 'memory'){
				storeObject = new express.session.MemoryStore
			} else {
				var storePath = path.join(
					container.getParameter('kernel.project_path'),
					'node_modules',
					config.store.type
				);
				var store = require(storePath)(express);
				storeObject = new store(config.store.options);
			}

			container.set('session.store', storeObject);

			app.use(express.session({ 
				key: config.key,
				secret: config.secret,
				maxAge: new Date(Date.now() + config.lifetime),
				store: storeObject
			}));			
		}
	},

	/**
	 * Find all of the pre-register middleware tags and register them
	 *
	 * @param  {Container} container
	 * @param  {Function} done
	 * @return {void}
	 */
	preRegisterMiddleware: function(container, done){

		var tags = container.getTagsByName('app.pre_middleware');

		if (!tags || tags.length === 0){
			done();
			return;
		}

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
	 * Find all of the registered middleware tags and register them
	 * 
	 * @param  {Container} container
	 * @pram   {Function} done
	 * @return {void}
	 */
	registerMiddleware: function(container, done){

		var tags = container.getTagsByName('app.middleware');

		if (!tags || tags.length === 0){
			done();
			return;
		}

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

		if (!tags || tags.length === 0){
			cb();
			return;
		}

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

		// make sure that there's a public bundle directory
		var publicBundlePath = path.join(container.getParameter('kernel.app_public_path'), 'bundles');
		if (!fs.existsSync(publicBundlePath)){
			fs.mkdirSync(publicBundlePath);
		}

		bundles.forEach(function(bundle){
	
			var dir = path.join(container.get('namespace.resolver').resolve(bundle), 'lib', 'resources', 'public');

			if (!fs.existsSync(dir)){
				return;
			}

			// create a symlink to the public path for the bundle
			var publicPath = path.join(container.getParameter('kernel.app_public_path'), 'bundles', bundle);

			var stat;
			try {
				stat = fs.lstatSync(publicPath);
			} catch (e) {
				stat = null;
			}

			try {
				if (!stat || (!stat.isDirectory() && !stat.isSymbolicLink())) {
					fs.symlinkSync(dir, publicPath, 'dir');
				}
			} catch (e) {
				console.error('Unable to create symbolic link for ' + dir + ' => ' + publicPath);
				console.error(e.stack || e);
			}
		});
		
		// register the main public path
		container.get('express.app').use(require('express').static(container.getParameter('kernel.app_public_path')));
	},

    /**
     * Copy a service depending on its scope into a new container.
     * @param {Container} the global container
     * @param {Container} the new container
     * @param {String} the service id.
     * @returns {Service}
     */
    copyServiceIntoScope: function(globalContainer, scopedContainer, sid){
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
    },

    /**
     * Create a request scope. If specified a a service in request scope
     * will have a new instance for the life of the request.
     *
     * @param controller
     * @param container
     * @returns {{controller: ExpressListener.constructor, container: *}}
     */
    createRequestScope: function(controller, container, req, res){

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

        // Override the get service parameter. Return
        // a new service instance at the request scope.
        _container.get = function(id){
            return self.copyServiceIntoScope(container, this, id);
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

        return {controller: _controller, container:_container, req: _req, res: res};
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

		if (typeof routes == 'undefined' || routes.length == 0){
			throw new Error('no routes are defined!');
		}

		// add routes and SSL rules to the Router
		container.get('router').setRoutes(routes);
		container.get('router').setSSLRules(container.getParameter('conga.controller.ssl'));

        // Look at config to see if request scoping is enabled.
        // if it does not exist it defaults to true.
        var scopeEnabled = true;
        var config = container.get('config').get('framework');
        if (typeof config.scope !== 'undefined' &&
            typeof config.scope.request !== 'undefined'){
            scopeEnabled = typeof config.scope.request === 'string' ?
                           config.scope.request == 'true' :
                           config.scope.request;
        }


		// register each route
		routes.forEach(function(route){

			(function(container){

				// register the route
				var verb = route.method.toLowerCase();

				// add the express verb action
				app[verb](route.path, function(req, res){

					var run = function(){

						// add some conga stuff to the request
						req.conga = {
							route: route
						};
                        var controller = container.get(route.controller);

                        var scope;
                        if (scopeEnabled) {
                            scope = self.createRequestScope(controller, container, req, res);
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
                                    scope.controller,
									route.action,
									'pre',
                                    scope.req,
                                    scope.res,
									function(){

										try {
											if (typeof scope.controller[route.action] === 'function') {

												// call the controller method
                                                scope.controller[route.action].call(scope.controller, scope.req, scope.res);

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
					};

					// check if we need to run the ssl check
					if (container.get('config').get('framework').ssl.enabled === true
						&& (typeof container.getParameter('conga.controller.ssl')[route.controller] !== 'undefined'
						&& container.getParameter('conga.controller.ssl')[route.controller] === '*'
						|| (typeof container.getParameter('conga.controller.ssl')[route.controller] !== 'undefined'
						&&	typeof container.getParameter('conga.controller.ssl')[route.controller][route.action] !== 'undefined'
						))){

						// run the ssl handler
						container.get(container.get('config').get('framework').ssl.handler)
							.run(container, req, res, function(){
								run();
							});

					} else {
						run();
					}

				});
				
			}(container));
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

        // Check to see if request scope was added
        if (typeof res.__controller__ !== 'undefined') {
            container = res.__controller__.container;
        }

		// make sure there are templates
		if (typeof container.getParameter('conga.templates') === 'undefined'
			|| container.getParameter('conga.templates').length === 0
			|| !container.getParameter('conga.templates')[route.controller]){

			container.get('logger').error('template not found for: ' + route.controller + '::' + route.action);
			res.send(500, "Internal error");
			return;
		}

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

                    // Clean up scope request
                    if (typeof res.__controller__ !== 'undefined') {
                        delete res.__controller__.container;
                    }

					if (err) return req.next(err);

					// set headers
					var contentType = res.getHeader('content-type');
					if (!contentType || contentType.length === 0) {
						res.setHeader('Content-Type', 'text/html');
					}
					res.setHeader('Content-Length', res.body.length);
					res.setHeader('X-Powered-By', container.getParameter('response.x-powered-by'));

					// send final request
					res.send(status, res.body);

					return;
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
				container.get('namespace.resolver').injectSubpath(template.namespace, 'views').replace(':', '/')
					+ '.' + container.getParameter('app.view.engine')
			);

			fs.exists(appPath, function(exists){

				if (exists){
					self.templatePathCache[template.namespace] = appPath;
				} else {
					self.templatePathCache[template.namespace] = 
						container.get('namespace.resolver').resolveWithSubpath(
			  			template.namespace + '.' + container.getParameter('app.view.engine'), 'lib/resources/views');
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
	handleJsonResponse: function(req, res, data, code){

		if (typeof code === 'undefined' || code === null){
			code = 200;
		}

        // Check to see if request scope was added
        if (typeof res.__controller__ !== 'undefined') {
            container = res.__controller__.container;
        }

		// kernel.response
		container.get('event.dispatcher').dispatch(
			'kernel.response', 
			{ request : req, response : res, body: data, code: code, container : container },
			function(){

				//if (err) return req.next(err);
                // Clean up scope request
                if (typeof res.__controller__ !== 'undefined') {
                    delete res.__controller__.container;
                }

				// set headers
				res.setHeader('X-Powered-By', container.getParameter('response.x-powered-by'));
				res.setHeader('Content-Type', 'application/json');

				// send final request
				res.json(code, data);
				return;
			}
		);
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
			container.get('express.server').listen(container.get('config').get('framework').app.port);
			container.get('logger').info('server started at http://localhost:' + container.get('config').get('framework').app.port);
			
			// start up HTTPS server (if it's enabled in the config)
			var sslConfig = container.get('config').get('framework').ssl;

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


ExpressListener.prototype.constructor = ExpressListener;

module.exports = ExpressListener;
