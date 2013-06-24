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
 * The @RestProperty annotation is used to identify an
 * object property that should be exposed through REST
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 * 
 * @param {Object} data
 */
var RestProperty = function(data){

};

/**
 * Define the annotation string to find
 * 
 * @var {String}
 */
RestProperty.annotation = 'RestProperty';

/**
 * Define the targets that the annotation can be applied to
 * 
 * @var {Array}
 */
RestProperty.targets = [Annotation.PROPERTY];

module.exports = RestProperty;