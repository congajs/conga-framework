/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// third-party modules
const log4js = require('log4js');

/**
 * The LoggerListener creates configured logger objects
 * and sets them to the container during kernel boot
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class LoggerListener {

    /**
     * Create the loggers on kernel boot
     *
     * @param  {Object}   event
     * @param  {Function} next
     * @return {void}
     */
    onKernelBoot(event, next) {

        const container = event.container;
        const config = event.container.get('config').get('framework').logger;

        const logConfig = {
            appenders: {},
            // @todo - move this all to config
            categories: {}
        };

        // add appenders to the log4js config object
        for (let i in config) {

            switch (config[i].type) {

                case 'console':

                    logConfig.appenders[i] = { type : 'console', category : i };
                    break;

                case 'file':

                    logConfig[i] = {
                        type : 'file',
                        filename : config[i].options.filename,
                        maxLogSize : config[i].options.max_log_size,
                        backups : config[i].options.backups,
                        category : i
                    };

                    break;

                default:

                    console.error('Unknown logger type: ' + config[i].type);
                    process.exit();
                    break;
            }

            logConfig.categories[i] = { appenders: [i], level: config[i].level };
        }

        log4js.configure(logConfig);

        // create loggers and set on container
        for (let i in config) {
            const logger = log4js.getLogger(i);
            container.set('logger.' + i, logger);
        }

        // hack to make an alias to default for now
        container.set('logger', container.get('logger.default'));

        next();
    }
}
