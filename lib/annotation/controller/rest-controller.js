/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// local modules
var Annotation = require('conga-annotations').Annotation;

/**
 * The @RestController annotation specifies that a controller should
 * automatically be decorated with REST actions that get proxied
 * to a given service within the application DIC container
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 * 
 * @param {Object} data
 */
var RestController = function(data){

	this.adapter = data['adapter'];
	this.model = data['model'];

	if (typeof data['wrappedPagination'] !== 'undefined'){
		this.wrappedPagination = data['wrappedPagination'];
	}

	// delete all expected parameters so that only options remain
	delete data['adapter'];
	delete data['model'];
	delete data['wrappedPagination'];

	this.options = data;
};

/**
 * Define the annotation string to find
 * 
 * @var {String}
 */
RestController.annotation = 'RestController';

/**
 * Define the targets that the annotation can be applied to
 * 
 * @var {Array}
 */
RestController.targets = [Annotation.CONSTRUCTOR];

/**
 * The REST adapter to use
 * 
 * @type {String}
 */
RestController.prototype.adapter = null;

/**
 * The model that the REST controller is a representation of
 * 
 * @var {String}
 */
RestController.prototype.model = null;

/**
 * [wrappedPagination description]
 * @type {Boolean}
 */
RestController.prototype.wrappedPagination = false;

/**
 * Optional parameters that a specific adapter implementation may need
 * 
 * @type {Object}
 */
RestController.prototype.options = null;

module.exports = RestController;