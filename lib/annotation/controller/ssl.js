/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const Annotation = require('conga-annotations').Annotation;

/**
 * The @SSL annotation is used to specify SSL requirements
 * for a controller/action
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class SSLAnnotation extends Annotation {

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
		 * The force property
		 * 
		 * This specifies that the target should be
		 * forced to use SSL
		 * 
		 * @var {String}
		 */
		force = null;
	}
}