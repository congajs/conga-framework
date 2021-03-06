/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * The BundleFinder finds the absolute path to a bundle in the given
 * lookup paths
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class BundleFinder {

    /**
     * Create the finder with an array of lookup paths
     *
     * @param  {Object} bundles a hash of bundle names to paths
     */
    constructor(bundles) {
        this.bundles = bundles;
    }

    /**
     * Add a bundle path
     *
     * @param   {String} bundle the bundle name
     * @param   {String} path   the bundle's absolute path
     * @returns {String}
     */
    add(bundle, path) {
        this.bundles[bundle] = path;
    }

    /**
     * Find the path to a bundle in the lookup paths
     *
     * @param   {String} bundle
     * @returns {String}
     */
    find(bundle) {
        return this.bundles[bundle];
    }

    /**
     * Check if the given bundle has been registered
     *
     * @param  {String}  bundle
     * @return {Boolean}
     */
    has(bundle) {
        return bundle in this.bundles;
    }
};
