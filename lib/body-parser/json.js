const bodyParser = require('body-parser');

const parseJson = bodyParser.json();

const parser = function(req, res, next) {

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

module.exports = parser;
