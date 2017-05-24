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
     *
     * @return {Void}
     */
    onRenderResponse(req, res, data, status, cb) {
        cb(null, null);
    }

    /**
     * Send the final response
     *
     * @param  {Response}  res
     * @param  {Object}    data
     * @param  {String}    body
     * @param  {Number}    status
     * @param  {Function}  cb
     *
     * @return {Void}
     */
    onSendResponse(req, res, data, body, status) {
        res.setHeader('Content-Type', 'application/json');
        res.status(status).json(data);
    }
}
