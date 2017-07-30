/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const ErrorResponse = require('../response/ErrorResponse');

 /**
  * This is the base controller
  */
module.exports = class Controller {

    /**
     * Construc the controller with a Container
     *
     * @param  {Container} container the service container
     */
    constructor(container) {
        this.container = container;
    }

    /**
     * Build an error response
     *
     * @param  {Object} data      the error payload object
     * @param  {Number} [status]  the HTTP status code
     * @param  {String} [message] an optional error message
     * @param  {Object} [headers] object of custom headers
     * @return {ErrorResponse}
     */
    buildErrorResponse(data, status = 500, message = null, headers = {}) {
        return new ErrorResponse(data, status, message, headers);
    }
}
