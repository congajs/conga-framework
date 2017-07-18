/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// native modules
const path = require('path');

// third-party modules
const _ = require('lodash');

// local modules
const PreFilterAnnotation = require('../PreFilterAnnotation');
const PostFilterAnnotation = require('../PostFilterAnnotation');

/**
 * The FilterAnnotationHandler handles the @PreFilter
 * and @PostFilter annotations that are found within
 * a controller and sets the information on the
 * applications DIC container
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class FilterAnnotationHandler {

    /**
     * Get the annotation paths that should be parsed
     *
     * @return {Array}
     */
    getAnnotationPaths() {
        return [
            path.join(__dirname, '..', 'PostFilterAnnotation'),
            path.join(__dirname, '..', 'PreFilterAnnotation'),
        ];
    }

    /**
     * Handle all of the @PreFilter and @PostFilter
     * annotations on a controller
     *
     * @param {Container} container
     * @param {Reader}    reader
     * @param {Object}    controller
     *
     * @return {Array}
     */
    handleAnnotations(container, reader, controller) {

        // parse the filters from the controller
        const filters = this.parseFiltersFromFile(container, reader, controller);

        // make sure that container has a filters object
        if (!container.hasParameter('conga.controller.filters')) {
            container.setParameter('conga.controller.filters', {});
        }

        // store routes for express to use later on
        for (var i in filters) {
            container.getParameter('conga.controller.filters')[i] = filters[i];
        }
    }

    /**
     * Find all the filter annotations from a controller file
     * and return an object with all the filter metadata
     *
     * {
     *    controller.id : {
     *          action: {
     *            pre: [ { service : serviceId, parameters : {} } ],
     *            post: [ { service : serviceId, parameters : {} ]
     *          }
     *      }
     * }
     *
     * @param {Container} container
     * @param {Reader}    reader
     * @param {Object}    controller
     *
     * @return {Object}
     */
    parseFiltersFromFile(container, reader, controller) {

        // set up return object
        const filters = {};

        // parse the annotations
        reader.parse(controller.filePath);

        const constructorAnnotations = reader.definitionAnnotations;

        constructorAnnotations.forEach((annotation) => {

            // @PreFilter
            if (annotation instanceof PreFilterAnnotation) {
                this.addFilter(filters, controller, '*', 'pre', annotation);
            }

            // @PostFilter
            if (annotation instanceof PostFilterAnnotation){
                this.addFilter(filters, controller, '*', 'post', annotation);
            }

        });

        // get the annotations
        const methodAnnotations = reader.methodAnnotations;

        // find method annotations
        methodAnnotations.forEach((annotation) => {

            // @PreFilter
            if (annotation.annotation === 'PreFilterAnnotation') {
                this.addFilter(filters, controller, annotation.target, 'pre', annotation);
            }

            // @PostFilter
            if (annotation.annotation === 'PostFilterAnnotation') {
                this.addFilter(filters, controller, annotation.target, 'post', annotation);
            }

        });

        return filters;
    }

    /**
     * Add the filter information for a controller/action/type to the final
     * filters array
     *
     * @param  {Array} filters
     * @param  {String} controller
     * @param  {String} action
     * @param  {String} type
     * @param  {Object} annotation
     *
     * @return {void}
     */
    addFilter(filters, controller, action, type, annotation) {

        if (typeof filters[controller.serviceId] === 'undefined'){
            filters[controller.serviceId] = {};
        }

        if (typeof filters[controller.serviceId][action] === 'undefined'){
            filters[controller.serviceId][action] = {};
        }

        if (typeof filters[controller.serviceId][action][type] === 'undefined'){
            filters[controller.serviceId][action][type] = [];
        }

        filters[controller.serviceId][action][type].push(
            {
                service : annotation.service,
                parameters : annotation.parameters
            }
        );
    }
}
