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
 * The @SSL annotation is used to specify SSL requirements
 * for a controller/action
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = Annotation.extend({

	/**
	 * Define the annotation string to find
	 * 
	 * @var {String}
	 */
	annotation: 'SSL',

	/**
	 * Define the targets that the annotation can be applied to
	 * 
	 * @var {Array}
	 */
	targets: [Annotation.CONSTRUCTOR, Annotation.METHOD],

	/**
	 * The force property
	 * 
	 * This specifies that the target should be
	 * forced to use SSL
	 * 
	 * @var {String}
	 */
	force: null

});