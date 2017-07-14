/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// built-in modules
const fs = require('fs');
const path = require('path');

// third-party modules
const annotations = require('@conga/annotations');

// local modules
const TagSorter = require('../ioc/TagSorter');

/**
 * The ControllerCompiler takes controller files, runs them through the
 * annotation handlers and then registers them in the service container
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class ControllerCompiler {

    /**
     * Construct the ControllerCompiler
     *
     * @param  {Container} container
     */
    constructor(container) {
        this.container = container;
        this.registry = new annotations.Registry();
        this.registerAnnotationPaths(this.registry);
        this.reader = new annotations.Reader(this.registry);
    }

    /**
     * Compile a controller and register it on the service container
     *
     * @param  {String} bundle
     * @param  {String} filePath
     * @return {void}
     */
    compile(bundle, filePath) {

        this.container.get('logger').debug('[conga-framework] - handling controller: ' + filePath);

        const filename = path.parse(filePath).base;
        const controllerServiceId = 'controller.' + bundle + '.' + filename.replace('.js', '');

        if (!this.container.hasParameter('conga.controllers')) {
            this.container.setParameter('conga.controllers', []);
        }

        const controller = {
            bundle: bundle,
            filePath: filePath,
            serviceId: controllerServiceId
        };

        this.container.getParameter('conga.controllers').push(controller);
		this.runAnnotationHandlers(controller);
    }

    /**
	 * Register all of the annotation paths on to the annotation registry
	 * from tagged annotatiton handlers
	 *
	 * @param  {Object}    registry
	 * @return {void}
	 */
	registerAnnotationPaths(registry) {

		// find all the tagged handlers
		const tags = this.container.getTagsByName('controller.annotation.handler');

		// run each handler
		tags.forEach((tag) => {

			const handler = this.container.get(tag.getServiceId());

			handler.getAnnotationPaths().forEach((annotationPath) => {
				registry.registerAnnotation(annotationPath);
			});
		});

	}

	/**
	 * Run all of the registered annotation handlers on a controller
	 *
	 * @param {String} controller
	 * @return {Void}
	 */
	runAnnotationHandlers(controller) {

		// find all the tagged handlers
		const tags = this.container.getTagsByName('controller.annotation.handler');

		TagSorter.sortByPriority(tags);

		// run each handler
		tags.forEach((tag) => {

			const handler = this.container.get(tag.getServiceId());

			this.container.get('logger').debug('[conga-framework] - running handler: ' + tag.getServiceId());

			handler[tag.getParameter('method')].call(handler, this.container, this.reader, controller);
		});
	}

}
