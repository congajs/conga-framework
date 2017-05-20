const path = require('path');
const DemoService = require('../data/projects/sample/src/demo-bundle/lib/service/DemoService');

describe("ServiceLoader", function() {

    var ServiceLoader = require('../../lib/ioc/ServiceLoader');

    beforeEach(function() {
        loader = new ServiceLoader([
            path.join(__dirname, '..', 'data', 'projects', 'sample', 'src')
        ]);
    });

    it("should load service from project bundle", function() {
        const service = loader.load('demo-bundle:service/DemoService');
        expect(service === DemoService).toEqual(true);
    });
});
