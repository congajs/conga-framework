/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// built-in modules
const fs = require('fs-extra');
const path = require('path');

// third-party modules


// local modules

/**
 * The BuildListener handles building cache, etc. for a production build
 */
module.exports = class BuildListener {

    /**
     * Initialize express when the kernel boots up
     *
     * @param {Object} event
     * @param {Function} next
     * @return {void}
     */
    onKernelBuild(event, next) {



        next();

    }

}
