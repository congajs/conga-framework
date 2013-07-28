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
 * The @Template annotation specifies that a controller action
 * should use a template instead of returning a JSON response
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = Annotation.extend({

	/**
	 * The annotation string
	 * 
	 * @var {String}
	 */
	annotation: 'Template',

	/**
	 * The targets that this annotation can be applied to
	 * 
	 * @var {Array}
	 */
	targets: [Annotation.METHOD],

	path: null,

	init: function(data){

		this.path = typeof data.value !== 'undefined' ? data.value : null;
	}

});