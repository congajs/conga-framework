const fs = require('fs');
const path = require('path');
const _ = require('lodash');

module.exports = class FileGenerator {

    generate(destination, template, vars) {

        return new Promise((resolve, reject) => {

            fs.readFile(path.join(__dirname, template), (err, data) => {

                const compile = _.template(data);
                const content = compile(vars);

                fs.writeFile(destination, content, (err) => {
                    if (err) return reject(err);
                    resolve();
                });

            });

        });

    }
}
