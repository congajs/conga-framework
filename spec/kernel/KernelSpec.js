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
        );

        kernel.addBundlePaths({
            //'demo-bundle': path.join(__dirname, '..', 'data', 'projects', 'sample', 'src', 'demo-bundle'),
            //'test-bundle': path.join(__dirname, '..', 'data', 'projects', 'sample', 'src', 'test-bundle'),
        });

        kernel.boot(() => {
            done();
        });
    });





    describe("Successful Response", function() {

        it("should return a successful response", (done) => {

            request('http://localhost:5555/test', (error, response, body) => {
                expect(response.statusCode).toEqual(200);
                expect(body).toEqual('{"foo":"bar"}');
                done();
            });

        });
    });





    describe("Error Handler", function() {

        it("should return an error response", (done) => {

            request('http://localhost:5555/error-test', (error, response, body) => {
                expect(response.statusCode).toEqual(401);
                expect(body).toEqual('{"message":"This is a fake 401 error"}');
                done();
            });

        });

        it("should return an error response with a default message", (done) => {

            request('http://localhost:5555/error-test/no-message', (error, response, body) => {
                expect(response.statusCode).toEqual(500);
                expect(body).toEqual('{"message":"Internal Server Error"}');
                done();
            });

        });

        it("should return an error response string", (done) => {

            request('http://localhost:5555/error-test/no-data', (error, response, body) => {
                expect(response.statusCode).toEqual(500);
                expect(body).toEqual('{"message":"Custom Error Message"}');
                done();
            });

        });

        it("should return an error response with custom headers", (done) => {

            request('http://localhost:5555/error-test/header', (error, response, body) => {
                const json = JSON.parse(body);
                expect(response.statusCode).toEqual(401);
                expect(body).toEqual('{"message":"Unauthorized"}');
                expect(response.headers['www-authenticate']).toEqual('Basic realm="header-test"');
                expect(response.headers['x-conga-test']).toEqual('ErrorController');
                done();
            });

        });

        it("should return a custom error response without a status code", (done) => {

            request('http://localhost:5555/error-test/custom', (error, response, body) => {
                const json = JSON.parse(body);
                expect(response.statusCode).toEqual(500);
                expect(json.message).toEqual("This is a custom error");
                expect(json.originalError.custom).toEqual(true);
                done();
            });

        });

        it("should return a custom error response with a status code", (done) => {

            request('http://localhost:5555/error-test/custom-status', (error, response, body) => {
                const json = JSON.parse(body);
                expect(response.statusCode).toEqual(403);
                expect(json.message).toEqual("This is a fake 403 error");
                expect(json.originalError.custom).toEqual(true);
                done();
            });

        });

        it("should return a 500 error with an invalid error response", (done) => {

            request('http://localhost:5555/error-test/invalid', (error, response, body) => {
                const json = JSON.parse(body);
                expect(response.statusCode).toEqual(500);
                expect(json.error).toEqual("Res.error() must be called with an instance of Error");
                expect(json.originalError).toEqual("this is not correct");
                done();
            });

        });

        it("should return a custom error response with custom headers", (done) => {

            request('http://localhost:5555/error-test/custom-header', (error, response, body) => {
                const json = JSON.parse(body);
                expect(response.statusCode).toEqual(401);
                expect(json.message).toEqual("Unauthorized");
                expect(json.originalError.custom).toEqual(true);
                expect(response.headers['www-authenticate']).toEqual('Basic realm="error-test"');
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





    describe("Promise", function() {
        it("should return a response for a resolved promise route", (done) => {

            request('http://localhost:5555/test/promise-resolve', (error, response, body) => {
                expect(response.statusCode).toEqual(200);
                expect(body).toEqual('{"message":"this is a resolved promise"}');
                done();
            });

        });

        it("should return an error response for a rejected promise route", (done) => {

            request('http://localhost:5555/test/promise-reject', (error, response, body) => {
                expect(response.statusCode).toEqual(401);
                expect(body).toEqual('{"message":"this is a rejected promise"}');
                done();
            });

        });
    });

});
