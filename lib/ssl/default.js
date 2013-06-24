/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * The DefaultSSLHandler provides a simple mechanism to
 * check if the current request (which should be served under HTTPS)
 * is actually being requested through HTTPS
 *
 * If not, the request is redirected to the SSL version of the current
 * request URL
 *
 * @author  Marc Roulias <marc@lampjunkie.com>
 */
var DefaultSSLHandler = function(){};

DefaultSSLHandler.prototype = {

	/**
	 * Run the SSL handler
	 * 
	 * @param  {Container} container
	 * @param  {Object}    req
	 * @param  {Object}    res
	 * @param  {Function}  next
	 * @return {void}
	 */
	run: function(container, req, res, next){

		// check if the secure flag was set or not
		if (req.secure === false){
			var host = container.get('config').get('ssl').host;
			res.redirect('https://' + host + req.path);
			return;
		}

		next();
	}
}

module.exports = DefaultSSLHandler;