/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * The module defines the configuration group name for the bundle and does any
 * validate or processing of the config parameters
 */
module.exports = {

    /**
     * Get the name of the configuration group
     *
     * @return {String}
     */
    getName: () => {
        return 'framework';
    },

    /**
     * Validate the bundle configuration
     *
     * @param  {Container} container
     * @param  {Object}    config
     * @param  {Function}  cb
     * @return {void}
     */
    validate: (container, config, cb) => {
        cb(null);
    },

    /**
     * Process the bundle configuration
     *
     * @param  {Container} container
     * @param  {Object}    config
     * @param  {Function}  cb
     * @return {void}
     */
    process: (container, config, cb) => {
        cb(null);
    }

};
