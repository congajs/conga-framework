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
 * The @PostFilter defines services that should be run
 * after executing a controller action (or all actions
 * in a controller)
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 * 
 * @param {Object} data
 */
var PostFilter = function(data){
	this.service = data['__value'];
	this.parameters = data['params'];
};

/**
 * Define the annotation string to find
 * 
 * @var {String}
 */
PostFilter.annotation = 'PostFilter';

/**
 * Define the targets that the annotation can be applied to
 * 
 * @var {Array}
 */
PostFilter.targets = [Annotation.CONSTRUCTOR, Annotation.METHOD];

/**
 * The service id for the filter
 * 
 * @type {String}
 */
PostFilter.prototype.service = null;

/**
 * The optional parameters to pass to filter
 * 
 * @var {String}
 */
PostFilter.prototype.parameters = null;

module.exports = PostFilter;