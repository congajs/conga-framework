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

    /**
     * @Route("/promise-resolve", name="default.promise-resolve", methods=["GET"])
     */
    promiseResolve(req, res) {
        return Promise.resolve({ message: 'this is a resolved promise' });
    }

    /**
     * @Route("/promise-reject", name="default.promise-reject", methods=["GET"])
     */
    promiseReject(req, res) {
        return Promise.reject(new ErrorResponse({ message: 'this is a rejected promise' }, 401));
    }

}
