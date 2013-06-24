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
 * 
 * @param {Object} data
 */
var Template = function(data){
	this.path = typeof data['__value'] !== 'undefined' ? data['__value'] : null;
};

/**
 * The annotation string
 * 
 * @var {String}
 */
Template.annotation = 'Template';

/**
 * The targets that this annotation can be applied to
 * 
 * @var {Array}
 */
Template.targets = [Annotation.METHOD];

/**
 * The path property
 * 
 * If this is set, the template will be loaded from this
 * path, otherwise the default mapping of controller/action
 * will be used
 * 
 * @var {String}
 */
Template.prototype.path = null;

module.exports = Template;