/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
const AbstractCommand = require('./AbstractCommand');

/**
 * This command lists of the routes in an app
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class ListRoutesCommand extends AbstractCommand {

    /**
     * Get the command configuration
     *
     * @type {String}
     */
    static get config() {

        return {
            command: "list:routes <name>",
            description: "List the registered routes in the application",
            // options: {
            //     'foo' : ['-f, --foo [value]', 'some foo']
            // },
            // arguments: ['name']
        };

    }

    /**
     * Run the command
     *
     * @param  {String}    value     the command value
     * @param  {Object}    options   hash of command line options
     * @param  {Function}  next      the next callback
     * @return {Void}
     */
    run(value, options, output, next) {

        this.container.get('logger').info('running routes:list');

		const routes = this.container.getParameter('conga.routes');

		console.log('Registered routes:');
		console.log('====================');

		routes.forEach((route) => {
			console.log(route.name + ' - ' + route.path + ' - ' + route.method);
		});

		cb();
    }
}
