const path = require('path');
const DemoService = require('../data/projects/sample/src/demo-bundle/lib/service/DemoService');

describe("ServiceLoader", function() {

    const BundleFinder = require('../../lib/bundle/BundleFinder');
    const ServiceLoader = require('../../lib/ioc/ServiceLoader');

    beforeEach(function() {

        finder = new BundleFinder({
            'demo-bundle': path.join(__dirname, '..', 'data', 'projects', 'sample', 'src', 'demo-bundle')
        });

        loader = new ServiceLoader(finder);
    });

    it("should load service from project bundle", function() {
        const service = loader.load('demo-bundle:service/DemoService');
        expect(service === DemoService).toEqual(true);
    });
});
