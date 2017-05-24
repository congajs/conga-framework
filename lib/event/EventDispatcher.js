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
	constructor() {

		/**
		 * Hash of event names to arrays of attached listeners
		 *
		 * {'my.event': [Function,Function,Function]}
		 *
		 *
		 * @var {Object}
		 */
		this.events = {};
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

		if (typeof this.events[event] === 'undefined') {
			this.events[event] = [];
		}

		this.events[event].push({ obj : obj, method : method });
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

		if (typeof this.events[name] === 'undefined' || this.events[name].length === 0) {
			cb();
			return;
		}

		const walk = (index, cb) => {

			if (typeof this.events[name][index] !== 'undefined') {

				evt = this.events[name][index];

				try {
					evt.obj[evt.method].call(evt.obj, event, function() {
						walk(index + 1, cb);
					});
				} catch (err) {
					console.log(err.stack || err);
					process.exit();
				}

			} else {
				cb();
			}
		};

		walk(0, cb);
	}
}
