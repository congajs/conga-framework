/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

var Annotation = require('conga-annotations').Annotation;

/**
 * The @Route annotation defines the information for a controller route
 * including it's path, name, and HTTP methods
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 * 
 * @param {Object} data
 */
var Route = function(data){
	this.path = data['__value'];
	this.name = data['name'];
	this.methods = data['methods'];
};

/**
 * Define the annotation string to find
 * 
 * @var {String}
 */
Route.annotation = 'Route';

/**
 * Define the targets that the annotation can be applied to
 * 
 * @var {Array}
 */
Route.targets = [Annotation.CONSTRUCTOR, Annotation.METHOD];

/**
 * The path of the route
 * 
 * This uses the same format that expressjs uses
 * 
 * Example: /product/:view
 * 
 * @var {String}
 */
Route.prototype.path = null;

/**
 * The name of the route
 * 
 * This gets used by the Router, so that routes can be
 * retrieved by name
 * 
 * @var {String}
 */
Route.prototype.name = null;

/**
 * An array of HTTP methods that the route will respond to
 * 
 * Example: ['GET', 'POST', 'PUT']
 * 
 * @var {Array}
 */
Route.prototype.methods = null;

module.exports = Route;