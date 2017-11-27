/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const bodyParser = require('body-parser');

const parseJson = bodyParser.json();

/**
 * This is the customized json body parser which catches any
 * JSON parsing errors and sets the error on the request
 * as req._ERROR_BAD_JSON
 *
 * @param  {Object}   req
 * @param  {[type]}   res
 * @param  {Function} next
 * @return {void}
 */
module.exports = function(req, res, next) {

    parseJson(req, res, (err) => {

        if (err) {

            try {

                JSON.parse(req.body);

            } catch (e) {

                req.body = null;
                req._ERROR_BAD_JSON = e.message;

            }

        }

        next();

    });
}
