const path = require('path');
const request = require('request');

const Kernel = require('../../lib/kernel/TestKernel');

describe("Kernel", function() {

    let kernel;

    beforeAll(function(done) {

        kernel = new Kernel(
            path.join(__dirname, '..', 'data', 'projects', 'sample'),
            'app',
            'test',
            {}
        )

        kernel.addBundlePaths({
            //'demo-bundle': path.join(__dirname, '..', 'data', 'projects', 'sample', 'src', 'demo-bundle'),
            //'test-bundle': path.join(__dirname, '..', 'data', 'projects', 'sample', 'src', 'test-bundle'),
        });

        kernel.boot(() => {
            done();
        });
    });

    it("should have a function service in bundle config parameters", (done) => {

        expect(typeof kernel.container.get('config').get('framework')['module.function']).toEqual('function');
        expect(kernel.container.get('config').get('framework')['service.test']('world')).toEqual('hello world');
        done();

    });

    it("should grab a function from a module in config parameters", (done) => {

        expect(typeof kernel.container.get('config').get('framework')['service.test']).toEqual('function');
        expect(kernel.container.get('config').get('framework')['service.test']('world')).toEqual('hello world');
        done();

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

    it("should return a response for a resolved promise route", (done) => {

        request('http://localhost:5555/promise-resolve', (error, response, body) => {
            expect(response.statusCode).toEqual(200);
            expect(body).toEqual('{"message":"this is a resolved promise"}');
            done();
        });

    });

    it("should return an error response for a rejected promise route", (done) => {

        request('http://localhost:5555/promise-reject', (error, response, body) => {
            expect(response.statusCode).toEqual(401);
            expect(body).toEqual('{"message":"this is a rejected promise"}');
            done();
        });

    });

});
