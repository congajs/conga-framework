const path = require('path');
const request = require('request');

describe("Kernel", function() {

    var Kernel = require('../../lib/kernel/TestKernel');
    var kernel;

    beforeEach(function() {
        kernel = new Kernel(
            path.join(__dirname, '..', 'data', 'projects', 'sample'),
            'app',
            'test',
            {}
        )
    });

    it("should boot", function(done) {

        kernel.boot(() => {

            request('http://localhost:5555', function (error, response, body) {
//console.log(response);
              expect(response.statusCode).toEqual(200);
              expect(body).toEqual('{"foo":"bar"}');
              done();
            });




        });


        //expect(service === DemoService).toEqual(true);
    });
});
