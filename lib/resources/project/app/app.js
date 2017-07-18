/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * This is the main entry point for an HTTP application
 */

// native modules
const path = require('path');

// 1. set up defaults
let environment = process.env.NODE_ENV;
let port = null;

 // use the current directory name as the app name
const app = path.basename(__dirname);

// 2. overwrite defaults with --env arguments if they exist
process.argv.forEach(function(val){

    // environment
    if (val.substring(0, 6) == '--env='){
        environment = val.substring(6);
    }

    // port
    if (val.substring(0, 7) == '--port='){
        port = val.substring(7);
    }

});

// 3. fallback to 'development' environment if one wasn't found
if (typeof environment === 'undefined'){
    environment = 'development';
}

// build hash of overwritten default options for kernel
const options = {
    port: port
};

// boot up the kernel
require('@conga/framework').boot('http', app, environment, options, (kernel) => {});
