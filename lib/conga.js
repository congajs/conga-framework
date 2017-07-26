/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const KernelFactory = require('./kernel/KernelFactory');

/**
 * This is the main object which bootstraps the conga.js application
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = {

    kernel: {
        factory: require('./kernel/KernelFactory') ,
        kernel: require('./kernel/Kernel') ,
        build: require('./kernel/BuildKernel') ,
        cli: require('./kernel/CliKernel') ,
        http: require('./kernel/HttpKernel')
    } ,

    config: {
        config: require('./config/Config') ,
        loader: require('./config/Loader')
    } ,

    ioc: {
        serviceLoader: require('./ioc/ServiceLoader') ,
        tagSorter: require('./ioc/TagSorter')
    } ,

    command: {
        AbstractCommand: require('./command/AbstractCommand') ,
        CommandInput: require('./command/CommandInput') ,
        ConsoleCommandOutput: require('./command/ConsoleCommandOutput')
    } ,

    Controller: require('./controller/Controller'),

    /**
     * Boot up the Kernel using the current project root path
     *
     * @returns {void}
     */
    boot: function(context, app, environment, options, cb) {

        // get a kernel instance for the given context
        const kernel = KernelFactory.factory(context, app, environment, options);

        // boot the kernel
        kernel.boot(function(err){

            cb(kernel);

            // shutdown the kernel on SIGTERM
            process.on('SIGTERM',function(){
                kernel.shutdown(function(){
                    process.exit(1);
                });
            });
        });
    }
};
