/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * The JsonResponseHandler handles taking data and sending it as
 * JSON in a response
 *
 * @author Marc Roulias <marc@lampjunkie.com>
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
     * @return {Void}
     */
    onRenderResponse(req, res, data, status, cb) {
        cb(null, null);
    }

    /**
     * Render an error response
     *
     * @param  {Request}       req
     * @param  {Response}      res
     * @param  {ErrorResponse} error
     * @return {Void}
     */
    onErrorResponse(req, res, error) {

        for (i in error.headers) {
            res.setHeader(i, error.headers[i]);
        }

        this.onSendResponse(req, res, error.data, null, error.status);
    }

    /**
     * Send the final response
     *
     * @param  {Response}  res
     * @param  {Object}    data
     * @param  {String}    body
     * @param  {Number}    status
     * @param  {Function}  cb
     * @return {Void}
     */
    onSendResponse(req, res, data, body, status) {
        res.setHeader('Content-Type', 'application/json');
        res.status(status).json(data);
    }
}
