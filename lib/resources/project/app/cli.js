/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const path = require('path');

/**
 * This is the interface to connect the current application
 * into the conga cli
 */
module.exports = {

    /**
     * Run a command
     *
     * @param  {String} file         the path to the command file
     * @param  {String} environment  the environment name
     * @param  {Object} args         hash of arguments
     * @param  {Object} options      hash of options
     * @return {void}
     */
    run: function(file, environment, args, options) {

        // boot up the kernel
        require('@conga/framework').boot('cli', path.basename(__dirname), environment, {}, (kernel) => {

            // run the command
            kernel.runCommand(file, args, options, () => {
                process.exit();
            });
        });
    }
}
