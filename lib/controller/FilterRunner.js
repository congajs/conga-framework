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
		const filters = [];

		// check if there are any filters
		if (typeof filterConfig[controller] === 'undefined') {
			next();
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

		filters.forEach((filter) => {

			(function(filter){

				calls.push(function(next) {

					var obj = container.get(filter.service);

					obj['run'].call(obj, req, res, filter.parameters, next);
				});

			}(filter));

		});

		async.series(calls, () => {
			next();
		});
	}

}
