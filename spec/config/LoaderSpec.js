const path = require('path');

describe("Loader", function() {

    // set up environment variables for ENV tests
    process.env['ENV_TEST'] = 'foo';
    process.env['ENV_TEST_2'] = '9876';

    const Loader = require('../../lib/config/Loader');
    let config;

    beforeAll(function() {
        loader = new Loader();
        config = loader.load(
            path.join(__dirname, '..', 'data', 'projects', 'sample'),
            'app',
            'test',
            {}
        );
    });

    it("should have bundle config parameters", function() {
        expect(config.parameters['demo.bundle.service.class']).toEqual('demo-bundle:service/DemoService');
    });

    it("should have environment specific bundle config parameters", function() {
        expect(config.parameters['test.bundle.service.class']).toEqual('test-bundle:service/TestService');
    });

    it("should have bundle service", function() {
        expect(config.services.filter((obj) => {
            return obj.id === 'demo.bundle.service';
        })[0].id).toEqual('demo.bundle.service');
    });

    it("should have replaced bundle service property with parameter", function() {
        expect(config.services.filter((obj) => {
            return obj.id === 'demo.bundle.service';
        })[0].constructor).toEqual('demo-bundle:service/DemoService');
    });

    it("should have replaced app config with ini parameters", function() {
        expect(config.parameters['bundles.config']['framework']['app']['host']).toEqual('localhost');
    });

    it("should have overwritten config with environment config", function() {
        expect(config.parameters['bundles.config']['framework']['app']['port']).toEqual(5555);
    });

    it("should have a parameter from ENV", function() {
        expect(config.parameters['from.env']).toEqual('foo');
    });

    it("should have another parameter from ENV", function() {
        expect(config.parameters['another.env']).toEqual('9876');
    });

    it("should should use a default value for ENV that wasn't found", function() {
        expect(config.parameters['default.env']).toEqual('use this default');
    });

});
