const Controller = require('../../../../../../../../lib/controller/Controller');
const ErrorResponse = require('../../../../../../../../lib/response/ErrorResponse');

/**
 * @Route("/test")
 */
module.exports = class DefaultController extends Controller {

    /**
     * @Route("/", name="default.index", methods=["GET"])
     */
    index(req, res) {
        res.return({foo: 'bar'});
    }

    /**
     * @Route("/post-json", name="default.post-json", methods=["POST"])
     */
    postJson(req, res) {
        res.return({
            body: req.body
        });
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

    /**
     * @Route("/inject-service", name="default.inject-services", methods=["GET"])
     */
    injectService(req, res, $myDemoService, $container) {
        res.return({foo: $myDemoService.sayHello()});
    }
}
