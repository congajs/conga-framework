/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * The SecurityListener checks for security roles defined
 * for a controller/action and performs authorization before
 * action execution
 * 
 * @author Marc Roulias <marc@lampjunkie.com>
 */
var SecurityListener = function(){};

SecurityListener.prototype = {

	/**
	 * Perform the security authorization on pre controller execution
	 * 
	 * @param  {Object}   event
	 * @param  {Function} next
	 * @return {void}
	 */
	onPreController: function(event, next){

		var container = event.container;

		// no authorization needed
		if (typeof container.getParameter('conga.security.rules')[event.controller] === 'undefined'){
			next();
			return;
		}

		// check if there is a rule for the controller/action
		if (typeof container.getParameter('conga.security.rules')[event.controller][event.action] !== 'undefined'){
			this.checkUserSecurity(
				event, 
				container.getParameter('conga.security.rules')[event.controller][event.action], 
				event.request,
				event.response,
				next
			);
		}

		// check if there is a rule for the whole controller
		else if (typeof container.getParameter('conga.security.rules')[event.controller]['*'] !== 'undefined'){
			this.checkUserSecurity(
				event, 
				container.getParameter('conga.security.rules')[event.controller]['*'], 
				event.request,
				event.response,
				next
			);
		}

		// no authorization needed
		else {
			next();
		}
	},

	/**
	 * Check if the user has permission to access the given controller action
	 * 
	 * @param  {Object}   event
	 * @param  {Array}    rules
	 * @param  {Object}   request
	 * @param  {Object}   response
	 * @param  {Function} next
	 * @return {void}
	 */
	checkUserSecurity: function(event, rules, request, response, next){

		// check if there is a user
		if (!request.user){
			this.handleError(event, request, response);
			return;
		}

		// check the user roles
		if (request.user.getRoles() === -1){
			this.handleError(event, request, response);
			return;
		}

		// authorized
		next();
	},

	/**
	 * Handle an authorization error
	 * 
	 * @param  {Object} event
	 * @param  {Object} request
	 * @param  {Object} response
	 * @return {void}
	 */
	handleError: function(event, request, response){

		console.log('SECURITY ERROR');

		var templates = event.container.getParameter('conga.templates');

		if (typeof templates[event.controller] !== 'undefined' &&
			typeof templates[event.controller][event.action] !== 'undefined'){
			response.redirect('/');

		} else {
			console.log('send json');
			response.json(401, { success : false, error : 'Permission denied' } );
		}
	}
};

module.exports = SecurityListener;