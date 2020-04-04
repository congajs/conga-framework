/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
const AbstractCommand = require('./AbstractCommand');

/**
 * This command generates new models in bundles from a source
 *
 * Example: $ conga generate:model -b bass,rest,validator -n User users
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class GenerateModelCommand extends AbstractCommand {

    /**
     * The command
     *
     * @return {String}
     */
    static get command() {
        return 'generate:model';
    }

    /**
     * The command description
     *
     * @return {String}
     */
    static get description() {
        return 'Generates new model classes from a source and adds annotations from registered listeners';
    }

    /**
     * Hash of command options
     *
     * @return {Object}
     */
    static get options() {
        return {
            'name': ['-n --name [value]', 'the name of the class to generate'],
            'source': ['-s, --source [value]', 'the source service "bass"'],
            'target': ['-t, --target [value]', 'the target (namespaced) directory (demo-bundle:model)'],
            'bundles': ['-b --bundles [value]', 'the bundle listeners to use'],
            'options': ['-o --options [value]', 'options for the source service (connection:default)'],
            'case': ['-c --case [value]', 'case to use for properties (camel, snake)']
        };
    }

    /**
     * Array of command argument names
     *
     * @return {Array<String>}
     */
    static get arguments() {
        return ['collection'];
    }

    /**
     * Execute the command
     *
     * @param  {CommandInput}  input   the command input data
     * @param  {CommandOutput} output  the output writer
     * @param  {Function}      next    the next callback
     * @return {void}
     */
    execute(input, output, next) {

        let bundles = input.getOption("bundles");
        let source = input.getOption("source");
        let target = input.getOption("target");
        let c = input.getOption("case");

        const name = input.getOption("name");
        const options = input.getOption("options");

        if (typeof bundles === "undefined") {
            bundles = [];
        } else {
            bundles = bundles.trim().split(",");
        }

        const sourceOptions = {
            manager: "api"
        };

        if (typeof source === "undefined") {
            source = "bass";
        }

        if (typeof target === "undefined") {
            target = "demo-bundle:model";
        }

        if (typeof c === "undefined") {
            c = "camel";
        }

        this.container.get("conga.model.generator").generate(
            name,
            input.getArgument("collection"),
            source,
            sourceOptions,
            this.container.get('namespace.resolver').resolveWithSubpath(target, 'lib'),
            bundles,
            c
        ).then((data) => {

            output.writeln(`Generated ${data.metadata.name} in ${data.target}`);

            next();
        }).catch((err) => {
            console.log(err);
            next();
        });

    }
}
