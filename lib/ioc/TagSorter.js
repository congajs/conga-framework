/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

module.exports = {

	/**
	 * Sort an array of Tags by priority
	 *
	 * Optionally pass in a default priority to
	 * set on tags that don't have one set
	 *
	 * @param  {Array} tags
	 * @param  {Number} default
	 *
	 * @return {Object}
	 */
	sortByPriority: function(tags, defaultPriority) {

		if (typeof defaultPriority === 'undefined') {
			defaultPriority = 8;
		}

		// make sure tag has a priority
		tags.forEach(function(tag) {
			if (tag.getParameter('priority') === null || typeof tag.getParameter('priority') === 'undefined') {
				tag.getParameters().priority = defaultPriority;
			}
		});

		// sort tags
		tags.sort(function(a, b) {
			if (a.getParameter('priority') < b.getParameter('priority'))
				return -1;
			if (a.getParameter('priority') > b.getParameter('priority'))
				return 1;
			return 0;
		});
	}
};
