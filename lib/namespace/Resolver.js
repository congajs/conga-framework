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

/**
 * The NamespaceResolver resolves namespaced path names
 * to their actual file paths within registered bundles.
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class NamespaceResolver {

	/**
	 * The constructor
	 */
	constructor() {

		/**
		 * Hash of namespaces to paths
		 *
		 * @var {Object}
		 */
		this.namespaces = {};
	}

	/**
	 * Register the path to a namespace
	 *
	 * @param {String} name  the file namespace
	 * @param {String} p     the path to file
	 *
	 * @return {void}
	 */
	register(name, p) {
		this.namespaces[name] = p;
	}

	/**
	 * Get the full path to a namespace
	 *
	 * @param {String} name
	 *
	 * @return {String}
	 */
	resolve(name) {
		return this.namespaces[name];
	}

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
	 * @param {String} name
	 * @param {String} subpath
	 *
	 * @return {String}
	 */
	resolveWithSubpath(name, subpath) {

		const parts = name.split(':');

		if (typeof this.namespaces[parts[0]] === 'undefined') {
			throw new Error('Path for namespace: ' + parts[0] + ' has not been registered!');
		}

		return path.join(this.namespaces[parts[0]], subpath, parts[1]);
	}

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
	 * @param  {String} name    the namespace
	 * @param  {String} subpath the subpath to inject
	 *
	 * @return {String}
	 */
	injectSubpath(name, subpath) {
		const parts = name.split(':');
		return parts[0] + '/' + subpath + '/' + parts[1];
	}

	/**
	 * Parse the namespace from a string
	 *
	 * @param {String} str
	 *
	 * @return {String}
	 */
	parseNamespace(str) {
		const parts = str.split(':');
		return parts[0];
	}

	/**
	 * Get all of the registered namespaces and their paths
	 *
	 * @return {Object}
	 */
	getNamespaces() {
		return this.namespaces;
	}

	/**
	 * Check if the given string is a valid namespace
	 *
	 * @param  {String} str
	 *
	 * @return {Boolean}
	 */
	isNamespace(str) {
		return str.indexOf(':') !== -1;
	}
}
