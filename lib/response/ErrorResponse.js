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
