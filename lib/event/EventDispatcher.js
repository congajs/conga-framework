/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * The EventDispatcher allows you to add named events and dispatch
 * all the events associated with a name
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class EventDispatcher {

    /**
     * The constructor
     */
    constructor(container) {

        /**
         * Hash of event names to arrays of attached listeners
         *
         * {'my.event': [Function,Function,Function]}
         *
         *
         * @var {Object}
         */
        this.events = {};

        /**
         * The service container
         * @var {Container}
         */
        this.container = container;
    }

    /**
     * Add a new event listener
     *
     * @param {String} event
     * @param {Object} obj
     * @param {Function} method
     * @param {Number} priority
     */
    addListener(event, obj, method, priority) {
        if (!(event in this.events)) {
            this.events[event] = [];
        }
        this.events[event].push({ obj, method, priority });
    }

    /**
     * Dispatch an event
     *
     * @param {String} name
     * @param {Object} event
     * @param {Function} cb
     */
    dispatch(name, event, cb) {

        let evt;

        if (!(name in this.events) || this.events[name].length === 0) {
            cb();
            return;
        }

        // TODO: doing this for now (it's not very clean to check for the request here)
        let stopwatchEvent;
        let stopwatch = this.container && this.container.has('profiler.stopwatch') &&
            this.container.get('profiler.stopwatch');

        if (stopwatch) {
            if (event.request) {
                stopwatch = stopwatch.request(event.request);
            } else {
                stopwatch = stopwatch.section();
            }
            stopwatchEvent = stopwatch.start(name, 'event.dispatcher');
        }

        const walk = (index, cb) => {

            if (this.events[name][index] !== undefined) {

                stopwatchEvent && index > 0 && stopwatchEvent.lap();

                evt = this.events[name][index];

                try {
                    evt.obj[evt.method].call(evt.obj, event, function() {
                        walk(index + 1, cb);
                    });
                } catch (err) {
                    console.error(err.stack || err);
                    stopwatch && stopwatch.ensureStopped();
                    process.exit();
                }

            } else {
                cb();
            }
        };

        walk(0, function() {
            stopwatch && stopwatch.ensureStopped();
            cb(...arguments);
        });
    }
};
