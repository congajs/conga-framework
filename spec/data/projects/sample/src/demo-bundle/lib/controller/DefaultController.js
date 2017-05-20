const Controller = require('../../../../../../../../lib/conga').Controller;

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

}
