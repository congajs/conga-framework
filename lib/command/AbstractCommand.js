/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const Table = require('cli-table');

 /**
  * This is the parent class for all commands
  *
  * @author Marc Roulias <marc@lampjunkie.com>
  */
module.exports = class AbstractCommand {

    /**
     * The command
     *
     * @return {String}
     */
    static get command() {
        return 'command:name <argument1> <argument2>';
    }

    /**
     * The command description
     *
     * @return {String}
     */
    static get description() {
        return 'Description of the command';
    }

    /**
     * Hash of command options
     *
     * @return {Object}
     */
    static get options() {
        return {
            //'foo' : ['-f, --foo [value]', 'description of foo']
        };
    }

    /**
     * Array of command argument names
     *
     * @return {Array<String>}
     */
    static get arguments() {
        return ['argument1', 'argument2'];
    }

    /**
     * Set the command up with a Container
     *
     * @param  {Container} container
     */
    constructor(container) {
        this.container = container;
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
        next();
    }

    /**
     * Create a cli table (using https://github.com/Automattic/cli-table)
     *
     * @param  {Object} options
     * @return {Table}
     */
    createTable(options) {
        return new Table(options);
    }
}
