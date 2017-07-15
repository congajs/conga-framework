/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * The AbstractConfiguration should be extended in a bundle to do any validation
 * or processing of the bundle's configuration values
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class AbstractConfiguration {

    /**
     * Get the name of the configuration group
     *
     * @return {String}
     */
    getName() {
        throw new Error('You must implement Configuration.getName()');
    }

    /**
     * Validate the bundle configuration
     *
     * @param  {Object}   config
     * @param  {Function} cb
     * @return {void}
     */
    validate(config, cb) {
        cb(null);
    }

    /**
     * Process the bundle configuration
     *
     * @param  {Object}   config
     * @param  {Function} cb
     * @return {void}
     */
    process(config, cb) {
        cb(null);
    }
}
