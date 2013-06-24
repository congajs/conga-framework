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
 * @param {Object} data
 */
var Security = function(data){
	this.roles = typeof data.roles !== 'undefined' ? data.roles : [];
};

/**
 * The annotation string
 * 
 * @var {String}
 */
Security.annotation = 'Security';

/**
 * The targets that this annotation can be applied to
 * 
 * @var {Array}
 */
Security.targets = [Annotation.CONSTRUCTOR, Annotation.METHOD];

/**
 * The roles property
 * 
 * The array of user roles that are allowed to access the
 * controller/actions
 * 
 * @var {String}
 */
Security.prototype.roles = null;

module.exports = Security;