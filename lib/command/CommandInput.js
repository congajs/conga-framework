/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * The CommandInput stores the arguments and options for a Command
 */
module.exports = class CommandInput {

    /**
     * Construct the CommandInput with arguments and options
     *
     * @param  {Object} args    hash of arguments
     * @param  {Object} options hash of options
     */
    constructor(args = {}, options = {}) {
        this.args = args;
        this.options = options;
    }

    /**
     * Get an argument by name
     *
     * @param  {String} name
     * @return {String}
     */
    getArgument(name) {
        return this.args[name];
    }

    /**
     * Get an option by name
     *
     * @param  {String} name
     * @return {String}
     */
    getOption(name) {
        return this.options[name];
    }

    /**
     * Check if an argument exists
     *
     * @param  {String} name
     * @return {Boolean}
     */
    hasArgument(name) {
        return !(typeof this.args[name] === 'undefined');
    }

    /**
     * Check if an option exists
     *
     * @param  {String} name
     * @return {Boolean}
     */
    hasOption(name) {
        return !(typeof this.options[name] === 'undefined');
    }
}
