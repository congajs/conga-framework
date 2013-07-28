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
 * The @Security annotation specifies that a controller or actions
 * should only be allowed for users with the defined roles
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 * 
 */
module.exports = Annotation.extend({

	/**
	 * Define the annotation string to find
	 * 
	 * @var {String}
	 */
	annotation: 'Security',

	/**
	 * Define the targets that the annotation can be applied to
	 * 
	 * @var {Array}
	 */
	targets: [Annotation.CONSTRUCTOR, Annotation.METHOD],

	/**
	 * The roles property
	 * 
	 * The array of user roles that are allowed to access the
	 * controller/actions
	 * 
	 * @var {String}
	 */
	roles: null
	
});