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
 * 
 * @param {Object} data
 */
var SSL = function(data){
	this.force = typeof data.force !== 'undefined' ? data.force : true;
};

/**
 * The annotation string
 * 
 * @var {String}
 */
SSL.annotation = 'SSL';

/**
 * The targets that this annotation can be applied to
 * 
 * @var {Array}
 */
SSL.targets = [Annotation.CONSTRUCTOR, Annotation.METHOD];

/**
 * The force property
 * 
 * This specifies that the target should be
 * forced to use SSL
 * 
 * @var {String}
 */
SSL.prototype.force = null;

module.exports = SSL;