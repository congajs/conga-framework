/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// third-party modules
const async = require('async');

/**
 * The FilterRunner runs registered pre/post filters
 * for a controller action
 *
 * @author  Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class FilterRunner {
    /**
     * The constructor
     *
     * @param  {Container} container
     */
    constructor(container) {
        this.container = container;
    }

    /**
     * Run all of the pre or post filters for a controller action
     *
     * @param  {String}    controller
     * @param  {String}    action
     * @param  {String}    type
     * @param  {Request}   req
     * @param  {Response}  res
     * @param  {Function}  next
     *
     * @return {void}
     */
    run(controller, action, type, req, res, next) {

        const container = this.container;
        const filterConfig = container.getParameter('conga.controller.filters');
        const calls = [];

        let filters = [];

        // profile the event
        let stopwatch = container.has('profiler.stopwatch') && container.get('profiler.stopwatch');
        if (stopwatch) {
            stopwatch = stopwatch.request(req);
            stopwatch.start(type + '.filter', 'controller.filter');
        }

        // check if there are any filters
        if (typeof filterConfig[controller] === 'undefined') {
            stopwatch && stopwatch.stop();
            next(null);
            return;
        }

        // check if there are controller level filters
        if (typeof filterConfig[controller]['*'] !== 'undefined'
            && typeof filterConfig[controller]['*'][type] !== 'undefined') {
            filters = filters.concat(filterConfig[controller]['*'][type]);
        }

        // check if there are action level filters
        if (typeof filterConfig[controller][action] !== 'undefined'
            && typeof filterConfig[controller][action][type] !== 'undefined') {
            filters = filters.concat(filterConfig[controller][action][type]);
        }

        filters.forEach(filter => {
            calls.push(next => {
                const obj = container.get(filter.service);
                obj.run(req, res, filter.parameters, next);
            });
        });

        async.series(calls, err => {
            stopwatch && stopwatch.ensureStopped();
            next(err);
        });
    }
};
