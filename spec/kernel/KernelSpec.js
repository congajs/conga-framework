const path = require('path');
const request = require('request');

describe("Kernel", function() {

    var Kernel = require('../../lib/kernel/TestKernel');
    var kernel;

    beforeAll(function(done) {
        kernel = new Kernel(
            path.join(__dirname, '..', 'data', 'projects', 'sample'),
            'app',
            'test',
            {}
        )

        kernel.addBundlePaths({
            'demo-bundle': path.join(__dirname, '..', 'data', 'projects', 'sample', 'src', 'demo-bundle'),
            'test-bundle': path.join(__dirname, '..', 'data', 'projects', 'sample', 'src', 'test-bundle'),
        });

        kernel.boot(() => {
            done();
        });
    });

    it("should return a successful response", (done) => {

        request('http://localhost:5555', (error, response, body) => {
            expect(response.statusCode).toEqual(200);
            expect(body).toEqual('{"foo":"bar"}');
            done();
        });

    });

    it("should return an error response", (done) => {

        request('http://localhost:5555/error-test', (error, response, body) => {
            expect(response.statusCode).toEqual(401);
            expect(body).toEqual('{"message":"This is a fake 401 error"}');
            done();
        });

    });

    it("should return a 500 error with an invalid error response", (done) => {

        request('http://localhost:5555/invalid-error-test', (error, response, body) => {
            const json = JSON.parse(body);
            expect(response.statusCode).toEqual(500);
            expect(json.error).toEqual("Res.error() must be called with an instance of ErrorResponse");
            expect(json.originalError).toEqual("this is not correct");
            done();
        });

    });

    it("should return a 404 error", (done) => {

        request('http://localhost:5555/this-path-doesnt-exist', (error, response, body) => {
            expect(response.statusCode).toEqual(404);
            done();
        });

    });

});
