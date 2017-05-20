describe("Config", function() {
    var Config = require('../../lib/config/Config');
    var config;

    beforeEach(function() {
        config = new Config({
            foo: 'bar',
            hello: 'world'
        });
    });

    it("should be able to find a valid parameters", function() {
        expect(config.get('foo')).toEqual('bar');
        expect(config.get('hello')).toEqual('world');
    });

    it("should have valid parameters", function() {
        expect(config.has('foo')).toEqual(true);
        expect(config.has('hello')).toEqual(true);
    });

    it("should not have unknown parameters", function() {
        expect(config.has('fake')).toEqual(false);
        expect(config.has('unknown')).toEqual(false);
    });
});
