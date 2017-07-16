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
 * This command will dump out information about all of the registered services
 * on the application container
 */
module.exports = class ContainerDumpCommand extends AbstractCommand {

    /**
     * The command
     *
     * @return {String}
     */
    static get command() {
        return 'container:dump';
    }

    /**
     * The command description
     *
     * @return {String}
     */
    static get description() {
        return 'List the registered services in the application';
    }

    /**
     * Hash of command options
     *
     * @return {Object}
     */
    static get options() {
        return {
            //'foo' : ['-f, --foo [value]', 'some foo']
        };
    }

    /**
     * Array of command argument names
     *
     * @return {Array<String>}
     */
    static get arguments() {
        return [];
    }

    /**
     * Execute the command
     *
     * @param  {CommandInput}  input   the command input data
     * @param  {CommandOutput} output  the output writer
     * @param  {Function}      next    the next callback
     * @return {void}
     */
    execute(input, output, next) {

		const services = this.container.getServices();
		const names = [];

		for (var i in services){
			names.push(i);
		}

		names.sort();

		output.writeln('Registered services:');
		output.writeln('====================');

		names.forEach((name) => {
			output.writeln('service: ' + name);
		});

		next();
    }
}
