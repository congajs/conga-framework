/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
const async = require('async');
const TagSorter = require('../ioc/TagSorter');

/**
 * The Builder finds any tagged build services and runs them during the build process
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class Builder {

    /**
     * Construc the Builder with a service container
     *
     * @param  {Container} container
     */
    constructor(container) {
        this.container = container;
    }

    /**
     * Find all of the tagged build services and run them
     *
     * @param  {Object}   targetConfig  the config settings for the target environment
     * @param  {Function} done
     * @return {void}
     */
    build(targetConfig, done) {

        this.container.get('logger').info('[conga-framework] - running builder');

        const tags = this.container.getTagsByName('kernel.build');

        if (!tags || tags.length === 0){
            done();
            return;
        }

        // sort tags by priority
        TagSorter.sortByPriority(tags);

        const calls = [];

        for (let i in tags) {
            const tag = tags[i];

            ((tag) => {
                calls.push(
                    (callback) => {
                        const service = this.container.get(tag.getServiceId());
                        const method = tag.getParameter('method');
                        service[method].call(service, this.container, targetConfig, callback);
                    }
                );
            })(tag);
        }

        // run the events!
        async.series(calls, (err, results) =>{
            done();
        });

    }
}
