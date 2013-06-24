
// built-in modules
var fs = require('fs');
var path = require('path');

// third-party modules
var _ = require('lodash');

// local modules
var Toolbar = require('./toolbar');

var ToolbarListener = function(){};

ToolbarListener.prototype = {

	cache: null,

	onKernelServerBoot: function(event, next){

		var container = event.container;
		var config = container.getParameter('bundles.config')['toolbar'];

		// create the toolbar
		var toolbar = new Toolbar(container);

		container.set('toolbar', toolbar);

		next();
	},

	/**
	 * Add the toolbar html/js to the final response html
	 * 
	 * @param event
	 * @param next
	 */
	onResponse: function(event, next){

		var container = event.container;

		if (typeof event.response.body !== 'undefined'){
			var toolbar = this.renderToolbar(container);
			event.response.body = event.response.body.replace('</body>', toolbar + '</body>');			
		}

		next();
	},
	
	/**
	 * Render the toolbar html
	 * 
	 * @param {Container} container
	 * @returns {String}
	 */
	renderToolbar: function(container){
		
		//return "<p>HERE IS THE TOOLBAR</p>";

		// var panels = [];
		// var jade = require('jade');
		
		// var config = container.getParameter('hybrid.webdebug.module_configs');

		// for(var i=0, j=config.length; i<j; i++){
		// 	panels = panels.concat(config[i].panels);
		// }

		// return jade.compile(fs.readFileSync(__dirname + '/../../views/toolbar.jade', {
		// 	debug: true,
		// 	compileDebug: true
		// }))({ panels : panels });

		if (this.cache === null){
			this.cache = _.template(fs.readFileSync(path.join(__dirname, 'template.html')).toString(), {});
		}

		return this.cache;
	}

};

module.exports = ToolbarListener;