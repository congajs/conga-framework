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
 * The @Jsonp annotation specifies that a controller action
 * should return a jsonp response
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 * 
 * @param {Object} data
 */
var Jsonp = function(data){

};

/**
 * Define the annotation string to find
 * 
 * @var {String}
 */
Jsonp.annotation = 'Jsonp';

/**
 * Define the targets that the annotation can be applied to
 * 
 * @var {Array}
 */
Jsonp.targets = [Annotation.METHOD];

module.exports = Jsonp;