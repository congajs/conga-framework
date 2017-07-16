const Controller = require('../../../../../../../../lib/controller/Controller');
const ErrorResponse = require('../../../../../../../../lib/response/ErrorResponse');

/**
 * Custom error class
 */
class CustomError extends Error {
    constructor(message) {
        super(message);
        this.custom = true;
    }
}

/**
 * @Route("/error-test")
 */
module.exports = class ErrorController extends Controller {

    /**
     * @Route("/", name="default.error-test", methods=["GET"])
     */
    errorTest(req, res) {
        res.error(new ErrorResponse({ message: 'This is a fake 401 error'}, 401));
    }

    /**
     * @Route("/no-message", name="default.no-message-error-test", methods=["GET"])
     */
    errorTestNoMessage(req, res) {
        res.error(new ErrorResponse());
    }

    /**
     * @Route("/no-data", name="default.no-data-error-test", methods=["GET"])
     */
    noDataErrorTest(req, res) {
        res.error(new ErrorResponse(null, 500, 'Custom Error Message'));
    }

    /**
     * @Route("/header", name="default.header-error-test", methods=["GET"])
     */
    headerErrorTest(req, res) {
        const err = new ErrorResponse({message: 'Unauthorized'}, 401, null, {
            'WWW-Authenticate': 'Basic realm="header-test"'
        });
        err.addHeader('X-Conga-Test', 'ErrorController');
        res.error(err);
    }

    /**
     * @Route("/custom", name="default.custom-error-test", methods=["GET"])
     */
    customErrorTest(req, res) {
        res.error(new CustomError('This is a custom error'));
    }

    /**
     * @Route("/custom-status", name="default.custom-status-error-test", methods=["GET"])
     */
    customStatusErrorTest(req, res) {
        res.error(new CustomError('This is a fake 403 error'), 403);
    }

    /**
     * @Route("/custom-header", name="default.custom-status-error-test", methods=["GET"])
     */
    customHeaderErrorTest(req, res) {
        const err = new CustomError('Unauthorized');
        err.headers = {'WWW-Authenticate': 'Basic realm="error-test"'};
        res.error(err, 401);
    }

    /**
     * @Route("/invalid", name="default.invalid-error-test", methods=["GET"])
     */
    invalidErrorTest(req, res) {
        res.error("this is not correct");
    }

}
