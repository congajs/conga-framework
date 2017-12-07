const Controller = require('../../../controller/Controller');

/**
 * @Route("/_conga/api/framework")
 */
module.exports = class FrameworkController extends Controller {

    /**
     * @Route("/services", methods=['GET'])
     */
    services(req, res) {

        const container = this.container.global;
        const scopes = container.__scope;
        const services = container.getServices();
        const names = [];

        const projectPath = this.container.getParameter('kernel.project_path');

        const bundles = {};

        let i;
        for (i in services) {

            const s = container.get(i);
            let bundle = 'unknown (dynamically set on container)';
            let p = 'unknown';

            if (typeof s.__CONGA__ !== 'undefined') {
                p = s.__CONGA__.path;
                bundle = s.__CONGA__.bundle;
            } else if (typeof Object.getPrototypeOf(s).__CONGA__ !== 'undefined') {
                p = Object.getPrototypeOf(s).__CONGA.bundle;
                bundle = Object.getPrototypeOf(s).__CONGA.path;
            }

            if (!(bundle in bundles)) {
                bundles[bundle] = [];
            }

            bundles[bundle].push({
                id: i,
                scope: i in scopes ? scopes[i] : 'global',
                bundle: bundle,
                path: p.replace(projectPath, '')
            });
        }

        const final = {};
        const props = Object.keys(bundles);
        props.sort();

        props.forEach((prop) => {

            final[prop] = bundles[prop];

            final[prop].sort((a, b) => {
                if (a.id < b.id) {
                    return -1;
                }
                if (a.id > b.id) {
                    return 1;
                }
                return 0;
            });
        });

        res.return({
            total: Object.keys(services).length,
            bundles: final
        });
    }

    /**
     * @Route("/parameters", methods=['GET'])
     */
    parameters(req, res) {

        const parameters = Object.assign({}, this.container.getParameters());
        const final = {};
        const props = Object.keys(parameters).sort();

        props.forEach((prop) => {
            final[prop] = parameters[prop].toString();
        });

        res.return({
            total: Object.keys(final).length,
            parameters: final
        });
    }

    /**
     * @Route("/routes", methods=['GET'])
     */
    routes(req, res) {

        const routes = this.container.getParameter('conga.routes');
        const bundles = {};
        let total = 0;

        routes.forEach(route => {
            if (typeof bundles[route.controllerInfo.bundle] === 'undefined') {
                bundles[route.controllerInfo.bundle] = [];
            }

            bundles[route.controllerInfo.bundle].push(route);
            total++;
        });

        res.return({
            bundles,
            total
        });
    }

    /**
     * @Route("/configs", methods=['GET'])
     */
    configs(req, res) {

        res.return({
            configs: this.container.get('config').parameters
        });
    }
}
