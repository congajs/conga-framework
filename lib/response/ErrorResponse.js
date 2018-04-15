/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * The default payload used if no message or data is given
 * @type {{message: string}}
 */
const DEFAULT_PAYLOAD = {message: 'Internal Server Error'};

/**
 * An ErrorResponse is returned from a controller when an error occurs and
 * contains a data payload along with an HTTP status
 */
class ErrorResponse extends Error {

    /**
     * Create an error response from another Error object
     * @param {Error} error
     * @param {Number} [status]
     * @param {String} [message]
     * @param {Object} [headers]
     * @returns {ErrorResponse}
     */
    static fromError(error, status = null, message = null, headers = null) {
        if (!(error instanceof Object)) {
            if (typeof error === 'string') {
                error = new Error(error);
            } else {
                throw new TypeError('Invalid Error Provided');
            }
        }
        status = status || error.status || 500;
        message = message || error.message || 'Unknown Error';
        headers = headers || error.headers || {};
        return new ErrorResponse(
            {
                status,
                message,
                originalError: error,
                stack: error.stack
            },
            status,
            message,
            headers
        );
    }

    /**
     * Construct the error
     * @param {Object} data the error payload object
     * @param {Number} [status] the HTTP status code
     * @param {String} [message] an optional error message
     * @param {Object} [headers] object of custom headers
     */
    constructor(data = DEFAULT_PAYLOAD, status = 500, message = null, headers = {}) {
        super(message === null ? JSON.stringify(data) : message);
        this.data = data || {message};
        this.status = status;
        this.headers = headers;
    }

    /**
     * Track the previous error
     * @param {Error} err
     * @returns {void}
     */
    set previous(err) {
        if (!this.data.stack) {
            this.data.stack = '';
        }
        this.data.stack += err.stack || '';
    }

    /**
     * See if any custom headers have been set
     * @returns {Boolean}
     */
    hasHeaders() {
        return this.headers instanceof Object && Object.keys(this.headers).length !== 0;
    }

    /**
     * Get the response headers to send back (if any)
     * @returns {Object}
     */
    getHeaders() {
        return this.headers;
    }

    /**
     * Get a single header from the custom header object
     * @param {String} header The name of the header
     * @returns {String|undefined}
     */
    getHeader(header) {
        return this.headers[header];
    }

    /**
     * See if a header exists by name
     * @param {String} header The header name
     * @returns {boolean}
     */
    hasHeader(header) {
        return header in this.headers;
    }

    /**
     * Add a response header to send back
     * @param {String} header The name of the header
     * @param {String} value The value of the header
     * @returns {void}
     */
    addHeader(header, value) {
        this.headers[header.toLowerCase()] = value;
    }

    /**
     * Get a single value from the data payload, or the entire payload
     * @param {String} [key] The data key you want to get - if not provided, the entire payload is returned
     * @returns {Object|*}
     */
    getData(key = null) {
        return (key && this.data[key]) || this.data;
    }

    /**
     * Get the response status code for this error
     * @returns {Number}
     */
    getStatus() {
        return this.status || 500;
    }
}

module.exports = ErrorResponse;