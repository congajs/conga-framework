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
     * Respond to a redirect
     *
     * @param  {Request}   req
     * @param  {Response}  res
     * @param  {String}    location the new location to redirect to
     * @param  {Number}    status the status to send
     * @param  {Function}  cb
     * @return {void}
     */
    onRedirectResponse(req, res, location, status, cb) {
        cb(null);
    }

    /**
     * Render an error response
     *
     * @param  {Request}        req
     * @param  {Response}       res
     * @param  {ErrorResponse}  error
     * @param  {Function}       cb
     * @return {void}
     */
    onErrorResponse(req, res, error, cb) {
        if (error.hasHeaders()) {
            res.header(error.getHeaders());
        }
        this.onSendResponse(req, res, error.getData(), null, error.getStatus(), () => {
            cb(null, null);
        });
    }

    /**
     * Send the final response
     *
     * @param  {Request}   req
     * @param  {Response}  res
     * @param  {Object}    data
     * @param  {String}    body
     * @param  {Number}    status
     * @param  {Function}   cb
     * @return {void}
     */
    onSendResponse(req, res, data, body, status, cb) {
        if (res.headersSent) {
            cb(null);
            return;
        }
        res.header('Content-Type', 'application/json');
        res.status(status).json(data);
        cb(null);
    }

    /**
     * Send the final redirect
     *
     * @param  {Request}   req
     * @param  {Response}  res
     * @param  {String}    location the new location to redirect to
     * @param  {Number}    status the status to send
     * @param  {Function}  cb
     */
    onSendRedirect(req, res, location, status, cb) {
        if (res.headersSent) {
            cb(null);
            return;
        }
        res.redirect(status, location);
        cb(null);
    }
};
