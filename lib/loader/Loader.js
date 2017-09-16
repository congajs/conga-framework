let isDecorateEnabled = true;

module.exports = {

    init(enabled) {
        isDecorateEnabled = enabled;
    },

    require(path, bundle = null) {

        const service = require(path);

        if (isDecorateEnabled) {

            (service.prototype || service).__CONGA__ = {
                bundle: bundle,
                path: path
            };

        }

        return service;
    }
}
