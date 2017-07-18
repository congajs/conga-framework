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
 * The @PreFilter defines services that should be run
 * before executing a controller action (or all actions
 * in a controller)
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 *
 * @param {Object} data
 */
module.exports = class PreFilterAnnotation extends Annotation {

    /**
     * Define the annotation string to find
     *
     * @var {String}
     */
    static get annotation() { return 'PreFilter'; }

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
         * The service id for the filter
         *
         * @type {String}
         */
        this.service = data.service || null;

        /**
         * The optional parameters to pass to filter
         *
         * @var {String}
         */
        this.parameters = data.paramters || {};

    }


}
