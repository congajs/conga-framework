// local libs
const Kernel = require('./AppTestKernel');

/**
 * Test Spec Helper
 *
 * @param {Number} [waitTimeout] Milliseconds to wait for the kernel to boot (defaults to 3 minutes)
 * @returns {void}
 **/
module.exports = (waitTimeout = 180000) => {

    /** make sure the kernel is loaded **/

    let kernel, isBoot = false;

    const waitForKernel = done => {
        if (kernel && isBoot) {
            done();
            return;
        }
        setImmediate(() => waitForKernel(done));
    };

    beforeAll(done => {

        kernel = new Kernel();

        kernel.boot(() => {
            isBoot = true;
            done();
        });

    }, waitTimeout);

    beforeEach(done => waitForKernel(done), waitTimeout);

};