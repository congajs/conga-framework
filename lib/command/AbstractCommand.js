/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

 /**
  * This is the base class for all commands
  *
  * @author Marc Roulias <marc@lampjunkie.com>
  */
module.exports = class AbstractCommand {

    /**
     * Get the command configuration
     * @type {String}
     */
    static get config() {

        return {
    		command: "test:command <name>",
    		description: "This is the abstract command",
    		options: {
    			'foo' : ['-f, --foo [value]', 'some foo']
    		},
    		arguments: ['name']
    	};

    }

    /**
     * Set the command up with a Container
     *
     * @param  {Conainer} container
     */
    constructor(container) {
        this.container = container;
    }

    /**
     * Run the command
     *
     * @param  {String}    value     the command value
     * @param  {Object}    options   hash of command line options
     * @param  {Function}  next      the next callback
     *
     * @return {Void}
     */
    run(value, options, next) {
        next();
    }
}
