/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * The JsonResponseHandler handles taking data and sending it as JSON in a response
 */
module.exports = class JsonResponseHandler {

    /**
     * Render the final response
     *
     * @param  {Request}   req
     * @param  {Response}  res
     * @param  {Object}    data
     * @param  {Number}    status
     * @param  {Function}  cb
     * @return {void}
     */
    onRenderResponse(req, res, data, status, cb) {
        cb(null, null);
    }

    /**
     * Render an error response
     *
     * @param  {Request}        req
     * @param  {Response}       res
     * @param  {ErrorResponse}  error
     * @return {void}
     */
    onErrorResponse(req, res, error) {
        if (error.hasHeaders()) {
            res.set(error.getHeaders());
        }
        this.onSendResponse(req, res, error.getData(), null, error.getStatus());
    }

    /**
     * Send the final response
     *
     * @param  {Response}  res
     * @param  {Object}    data
     * @param  {String}    body
     * @param  {Number}    status
     * @return {void}
     */
    onSendResponse(req, res, data, body, status) {
        res.set('Content-Type', 'application/json');
        res.status(status).json(data);
    }
}
