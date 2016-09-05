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
 * The @WebsocketRest specifies that websocket routes should
 * automatically be created for all restful actions within a controller
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class WebsocketRestAnnotation extends Annotation {

    /**
     * The possible targets
     *
     * (Annotation.DEFINITION, Annotation.CONSTRUCTOR, Annotation.PROPERTY, Annotation.METHOD)
     *
     * @type {Array}
     */
    static get targets() { return [Annotation.DEFINITION] }

}