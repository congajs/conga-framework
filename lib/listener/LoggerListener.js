/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// third-party modules
var log4js = require('log4js');

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

		var container = event.container;
		var config = event.container.get('config').get('framework').logger;

		var logConfig = {
			appenders: []
		};

		// add appenders to the log4js config object
		for (var i in config) {

			switch (config[i].type) {

				case 'console':

					logConfig.appenders.push({ type : 'console', category : i });
					break;

				case 'file':

					logConfig.appenders.push({
						type : 'file',
						filename : config[i].options.filename,
						maxLogSize : config[i].options.max_log_size,
						backups : config[i].options.backups,
						category : i
					});

					break;

				default:

					console.error('Unknown logger type: ' + config[i].type);
					process.exit();
					break;
			}
		}

		log4js.configure(logConfig);

		// create loggers and set on container
		for (var i in config) {
			var logger = log4js.getLogger(i);
			logger.setLevel(config[i].level);
			container.set('logger.' + i, logger);
		}

		// hack to make an alias to default for now
		container.set('logger', container.get('logger.default'));

		next();
	}
}
