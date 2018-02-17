// core libs
const path = require('path');
const process = require('process');

// framework libs
const Kernel = require('../../lib/kernel/TestKernel');

/**
 * Hardwire the test kernel to use our main app
 */
class TestKernel extends Kernel {
    /**
     * {@inheritDoc}
     * @see Kernel.constructor
     *
     * @param {Object} [options]
     */
    constructor(options = {}) {

        // path should be like - node_modules/.bin/jasmine OR node_modules/.bin/mocha etc...

        super(path.join(path.resolve(process.argv[1]), '..', '..', '..'), 'app', 'test', options);
    }
}

module.exports = TestKernel;