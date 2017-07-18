/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * The Config class is a wrapper around all config groups
 * from the merged configuration files and provides
 * methods to get the settings for particular config groups
 *
 * @author  Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class Config {

    /**
     * Construct with a hash of parameters
     *
     * @param  {Object} parameters
     */
    constructor(parameters) {
        this.parameters = parameters;
    }

    /**
     * Get a config group
     *
     * @param  {String} name
     * @return {Object}
     */
    get(name) {
        return this.parameters[name];
    }

    /**
     * Check if the given config group exists
     *
     * @param  {String} name
     * @return {Boolean}
     */
    has(name) {
        return !(typeof this.parameters[name] === 'undefined');
    }
}
