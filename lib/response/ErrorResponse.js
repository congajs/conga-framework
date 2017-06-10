/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * An ErrorResponse is returned from a controller when an error occurs and
 * contains a data payload along with an HTTP status
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class ErrorResponse extends Error {

    /**
     * Construct the error
     *
     * @param  {Object} data         the error payload object
     * @param  {Number} status       the HTTP status code
     * @param  {String} message      an option error message
     * @param  {Object} headers      object of custom headers
     */
    constructor(data, status, message = null, headers = {}) {
        super(message !== null ? message : JSON.stringify(data));
        this.data = data;
        this.status = status;
        this.headers = headers;
    }
}
