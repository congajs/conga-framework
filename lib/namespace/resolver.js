/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// built-in modules
var path = require('path');

/**
 * The NamespaceResolver resolves namespaced path names
 * to their actual file paths within registered bundles.
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 */
var NamespaceResolver = function(){
	this.namespaces = {};
};

NamespaceResolver.prototype = {

	/**
	 * Hash of namespaces to paths
	 * 
	 * @var {Object}
	 */
	namespaces: null,
		
	/**
	 * Register the path to a namespace
	 * 
	 * @param {String} name
	 * @param {String} p
	 */
	register: function(name, p){
		this.namespaces[name] = p;
	},
		
	/**
	 * Get the full path to a namespace
	 * 
	 * @param {String} name
	 * @returns {String}
	 */
	resolve: function(name){
		return this.namespaces[name];
	},
	
	/**
	 * Resolve the full url to a namspace with sub directory
	 * 
	 * Example input:
	 * 
	 *   ('demo-bundle:includes/menu', 'lib/view');
	 *   
	 * Output:
	 * 
	 *   /path/to/bundle/lib/view/includes/menu
	 * 
	 * @param name
	 * @param subpath
	 */
	resolveWithSubpath: function(name, subpath){
		var parts = name.split(':');
		return path.join(this.namespaces[parts[0]], subpath, parts[1]);
	},

	/**
	 * Inject a subpath into the namespace
	 *
	 * Example input:
	 *
	 *   ('demo-bundle:exception/error404', 'view')
	 *
	 * Output:
	 *
	 *   'demo-bundle:/view/exception/error404'
	 * 
	 * @param  {[type]} name    [description]
	 * @param  {[type]} subpath [description]
	 * @return {[type]}         [description]
	 */
	injectSubpath: function(name, subpath){
		var parts = name.split(':');
		return parts[0] + '/' + subpath + '/' + parts[1];
	},
	
	/**
	 * Parse the namespace from a string
	 * 
	 * @param {String} str
	 * @returns {String}
	 */
	parseNamespace: function(str){
		var parts = str.split(':');
		return parts[0];
	},
	
	/**
	 * Get all of the registered namespaces and their paths
	 * 
	 * @returns {Object}
	 */
	getNamespaces: function(){
		return this.namespaces;
	},

	/**
	 * Check if the given string is a valid namespace
	 * 
	 * @param  {String} str
	 * @return {Boolean}
	 */
	isNamespace: function(str){
		return str.indexOf(':') !== -1;
	}
};

module.exports = NamespaceResolver;