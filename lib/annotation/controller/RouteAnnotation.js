/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const Annotation = require('@conga/annotations').Annotation;

/**
 * The @Route annotation defines the information for a controller route
 * including it's path, name, and HTTP methods
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 *
 * @param {Object} data
 */
module.exports = class RouteAnnotation extends Annotation {

	/**
	 * Define the annotation string to find
	 *
	 * @var {String}
	 */
	static get annotation() { return 'Route'; }

    /**
     * The possible targets
     *
     * (Annotation.DEFINITION, Annotation.CONSTRUCTOR, Annotation.PROPERTY, Annotation.METHOD)
     *
     * @type {Array}
     */
    static get targets() { return [Annotation.DEFINITION, Annotation.METHOD] }

    constructor(data, filePath){

    	super(data, filePath);



    }

    init(data) {

    	/**
		 * The path of the route
		 *
		 * This uses the same format that expressjs uses
		 *
		 * Example: /product/:view
		 *
		 * @var {String}
		 */
		this.path = data.path || null;

		/**
		 * The name of the route
		 *
		 * This gets used by the Router, so that routes can be
		 * retrieved by name
		 *
		 * @var {String}
		 */
		this.name = data.name || null;

		/**
		 * An array of HTTP methods that the route will respond to
		 *
		 * Example: ['GET', 'POST', 'PUT']
		 *
		 * @var {Array}
		 */
		this.methods = data.methods || null;
    }

}
