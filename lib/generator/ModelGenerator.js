const path = require('path');

const changeCase = require('change-case');
const pluralize = require('pluralize');

/**
 * The ModelGenerator creates a Model in a new file within a bundle
 * using objects with metadata
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class ModelGenerator {

    constructor(container) {
        this.container = container;
    }

    /**
     * Create a new model in a bundle using given metadata
     *
     * @param  {String} name          the name of the model
     * @param  {String} collection    the source collection/table
     * @param  {String} source        the name of the data source "bass"
     * @param  {Object} sourceOptions object of options for data source
     * @param  {String} target        the target directory for the model file
     * @param  {Array}  bundles       array of bundles to include in generation
     * @param  {String} c             the case for the properties (snake/camel)
     * @return {Promise}
     */
    generate(name, collection, source, sourceOptions, target, bundles, c) {

        return new Promise((resolve, reject) => {

            const ds = this.getDataSource(source);
            const decorators = this.getDecorators(bundles);

            ds.getMetaDataForCollection(collection, sourceOptions).then((metadata) => {

                metadata.name = name;
                metadata.collection = collection;
                metadata.collectionSingular = pluralize.singular(collection);
                metadata.definition = {};
                metadata.statics = [];

                decorators.forEach((decorator) => {
                    decorator.decorate(metadata);
                });

                metadata.properties.forEach((property) => {
                    property.property = this.changeCase(property.property, c);

                    if (property.enums) {

                        const values = {};

                        property.enums.forEach((e) => {
                            values[e] = e;
                        });

                        const enumName = changeCase.constantCase(property.property);

                        metadata.statics.push({
                            name: enumName,
                            property: property.property,
                            value: values
                        });

                        property.defaultValue = name + '.' + enumName + '.' + property.default;
                    }
                });

                this.build(target, metadata).then(() => {
                    resolve({
                        target: target,
                        metadata: metadata
                    });
                });
            });
        });
    }

    /**
     * Get the data source to use
     *
     * @param  {String} name datasource name
     * @return {Object}
     */
    getDataSource(name) {

        const tags = this.container.getTagsByName('conga.model.generator.datasource');
        let ds = null;

        tags.forEach((tag) => {

            if (tag.getParameter("id") == name) {
                ds = this.container.get(tag.getServiceId());
            }

        });

        return ds;
    }

    /**
     * Get an array of decorations from the given bundles
     *
     * @param  {Array} bundles
     * @return {Object}
     */
    getDecorators(bundles) {

        const decorators = [];
        const tags = this.container.getTagsByName("conga.model.generator.decorator");

        tags.forEach((tag) => {

            if (bundles.length === 0 || bundles.indexOf(tag.getParameter("id")) > -1) {
                decorators.push(this.container.get(tag.getServiceId()));
            }

        });

        return decorators;
    }

    /**
     * Change the inflection of a property using the given inflection type
     *
     * @param  {String} property
     * @param  {String} c
     * @return {String}
     */
    changeCase(property, c) {

        switch (c) {

            case "camel":

                return changeCase.camelCase(property);
                break;

            case "snake":

                return changeCase.snakeCase(property);
                break;
        }
    }

    /**
     * Generate the file
     *
     * @param  {String} target   the path to the target directory
     * @param  {Object} metadata the class metadata
     * @return {Promise}
     */
    build(target, metadata) {

        // {
        //     name: "User",
        //     model: {
        //         annotations: [
        //             "@Bass:Document(collection="users")",
        //             "@Rest:Resource(type="user")"
        //         ]
        //     },
        //     statics: [
        //
        //     ],
        //     properties: [
        //         {
        //             name: "id",
        //             default: "null",
        //             annotations: [
        //                 "@Bass:ID",
        //                 "@Bass:Field(type="ObjectID", name="_id")",
        //                 "@Rest:ID"
        //             ]
        //         }
        //     ]
        // }

        return new Promise((resolve, reject) => {
            const template = path.join("templates", "model.template.js");

            this.container.get('conga.file.generator').generate(
                path.join(target, metadata.name + ".js"),
                template,
                {
                    metadata: metadata
                }
            ).then(() => {
                resolve();
            })
        });

    }
}
