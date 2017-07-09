/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * The EventDispatcher allows you to add named events and dispatch all the events associated with a name
 */
class EventDispatcher {
    /**
     * @param {Container} [container] The service container
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
         * @type {Container}
         */
        this.container = container;
    }

    /**
     * Add a new event listener
     * @param {String} name
     * @param {Object} obj
     * @param {Function} method
     * @param {Number} priority
     */
    addListener(name, obj, method, priority) {
        if (!(name in this.events)) {
            this.events[name] = [];
        }
        this.events[name].push({ obj, method, priority });
    }

    /**
     * Dispatch an event
     * @param {String} name
     * @param {Object} event
     * @param {Function} cb
     */
    dispatch(name, event, cb) {
        if (!(name in this.events) || this.events[name].length === 0) {
            cb();
            return;
        }

        // TODO: it's not clean to check for request here, but I'm not sure how else to do it yet
        let stopwatch = this.container && this.container.has('profiler.stopwatch') && this.container.get('profiler.stopwatch');
        let stopwatchEvent;
        if (stopwatch) {
            if (event.request) {
                stopwatch = stopwatch.request(event.request);
            } else {
                stopwatch = stopwatch.section();
            }
            stopwatchEvent = stopwatch.start(name, 'event.dispatcher');
        }

        const walk = (index, cb) => {

            stopwatchEvent && stopwatchEvent.lap();

            if (typeof this.events[name][index] !== 'undefined') {

                const evt = this.events[name][index];

                try {
                    evt.obj[evt.method].call(evt.obj, event, function() {
                        walk(index + 1, cb);
                    });
                } catch (err) {
                    console.error(err.stack || err);
                    stopwatchEvent && stopwatchEvent.stop();
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

}

module.exports = EventDispatcher;