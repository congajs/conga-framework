const Controller = require('../../../../../../../../lib/controller/Controller');
const ErrorResponse = require('../../../../../../../../lib/response/ErrorResponse');

/**
 * @Route("/")
 */
module.exports = class DefaultController extends Controller {

    /**
     * @Route("/", name="default.index", methods=["GET"])
     */
    index(req, res) {
        res.return({foo: 'bar'});
    }

    /**
     * @Route("/error-test", name="default.error-test", methods=["GET"])
     */
    errorTest(req, res) {
        res.error(new ErrorResponse({ message: 'This is a fake 401 error'}, 401));
    }

    /**
     * @Route("/invalid-error-test", name="default.invalid-error-test", methods=["GET"])
     */
    invalidErrorTest(req, res) {
        res.error("this is not correct");
    }

}
