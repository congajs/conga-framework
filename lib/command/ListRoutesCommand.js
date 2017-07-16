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
     * The command
     *
     * @return {String}
     */
    static get command() {
        return 'list:routes';
    }

    /**
     * The command description
     *
     * @return {String}
     */
    static get description() {
        return 'List the registered routes in the application';
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

        // need to force the routes to be generated since they are skipped
        // for the cli context
        this.container.get('conga.controller.annotation.listener').onKernelCompile({
            container: this.container
        }, () => {

            const routes = this.container.getParameter('conga.routes');

            const table = this.createTable({
                head: ['Name', 'Path', 'Method'],
                colWidths: [80, 80, 10]
            });

            output.writeln('Registered routes:');
            output.writeln('====================');

            routes.forEach((route) => {
                table.push([
                    route.name,
                    route.path,
                    route.method
                ]);
            });

            output.writeln(table.toString());

            next();

        });

    }
}
