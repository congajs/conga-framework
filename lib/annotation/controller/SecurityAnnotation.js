/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const Annotation = require('@conga/conga-annotations').Annotation;

/**
 * The @Security annotation specifies that a controller or actions
 * should only be allowed for users with the defined roles
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 *
 */
module.exports = class SecurityAnnotation extends Annotation {

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

		/**
		 * The roles property
		 *
		 * The array of user roles that are allowed to access the
		 * controller/actions
		 *
		 * @var {String}
		 */
		roles = null;
	}
}
