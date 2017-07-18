/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * This is the interface to load a build kernel
 */
const path = require('path');

 // use the current directory name as the app name
const app = path.basename(__dirname);
const environment = 'development';
const args = {};
const options = {};

// boot up the kernel
require('@conga/framework').boot('build', app, environment, {}, (kernel) => {

    // run the command
    kernel.build(args, options, () => {
        process.exit();
    });
});
