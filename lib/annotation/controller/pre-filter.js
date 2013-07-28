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
 * The @PreFilter defines services that should be run
 * before executing a controller action (or all actions
 * in a controller)
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 * 
 * @param {Object} data
 */
module.exports = Annotation.extend({

	/**
	 * Define the annotation string to find
	 * 
	 * @var {String}
	 */
	annotation: 'PreFilter',

	/**
	 * Define the targets that the annotation can be applied to
	 * 
	 * @var {Array}
	 */
	targets: [Annotation.CONSTRUCTOR, Annotation.METHOD],

	/**
	 * The service id for the filter
	 * 
	 * @type {String}
	 */
	service: null,

	/**
	 * The optional parameters to pass to filter
	 * 
	 * @var {String}
	 */
	parameters: null

});