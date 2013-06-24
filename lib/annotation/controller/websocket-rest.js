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
 * The @WebsocketRest specifies that websocket routes should
 * automatically be created for all restful actions within a controller
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 * 
 * @param {Object} data
 */
var WebsocketRest = function(data){
	this.prefix = data['prefix'];
};

/**
 * Define the annotation string to find
 * 
 * @var {String}
 */
WebsocketRest.annotation = 'WebsocketRest';

/**
 * Define the targets that the annotation can be applied to
 * 
 * @var {Array}
 */
WebsocketRest.targets = [Annotation.CONSTRUCTOR];

/**
 * The prefix of the WebsocketRest route
 * 
 * @var {String}
 */
WebsocketRest.prototype.prefix = null;

module.exports = WebsocketRest;