/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// local modules
const CommandInput = require('../command/CommandInput');
const ConsoleCommandOutput = require('../command/ConsoleCommandOutput');
const Kernel = require('./Kernel');

/**
 * The CliKernel is a kernel context which starts up
 * an application in the cli context
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class CliKernel extends Kernel {

    /**
     * Construct the kernel with project/environment/etc. settings
     *
     * @param  {String} projectRootPath  absolute path to project root
     * @param  {String} app              the app name
     * @param  {String} environment      the environment name
     * @param  {Object} options          hash of override options
     */
    constructor(projectRootPath, app, environment, options) {

        super(projectRootPath, app, environment, options);

        /**
         * The context name
         * @type {String}
         */
        this.context = 'cli';

        /**
         * The kernel events to fire
         * @type {Array}
         */
        this.kernelEvents = [
            'kernel.compile',
            'kernel.boot',
            'kernel.boot_cli',
            'kernel.postboot'
        ];
    }

    /**
     * Run a given command
     *
     * @param  {Object}     file     file path to command
     * @param  {Object}     args     hash of arguments
     * @param  {Object}     options  hash of options
     * @param  {Function}   cb       the callback function
     * @return {void}
     */
    runCommand(file, args, options, cb) {

        const command = require(file);
        const c = new command(this.container);
        c.execute(new CommandInput(args, options), new ConsoleCommandOutput(), cb);
    }
}
