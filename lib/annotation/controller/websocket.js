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
 * The @Websocket specifies that an entire controller or individual
 * action should be exposed through websockets
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 * 
 * @param {Object} data
 */
var Websocket = function(data){
	this.name = data['name'];
};

/**
 * Define the annotation string to find
 * 
 * @var {String}
 */
Websocket.annotation = 'Websocket';

/**
 * Define the targets that the annotation can be applied to
 * 
 * @var {Array}
 */
Websocket.targets = [Annotation.METHOD];

/**
 * The name of the Websocket route
 * 
 * @var {String}
 */
Websocket.prototype.name = null;

module.exports = Websocket;