/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// built-in modules
const path = require('path');

module.exports = {

    /**
     * Build and return a kernel for the given
     * context and environment
     *
     * @param  {String} context        the context name
     * @param  {String} environment    the environment name
     * @param  {Object} options        hash of options
     * @return {Kernel}
     */
    factory: function(context, app, environment, options) {

        const validContexts = ['http', 'cli', 'build'];

        if (validContexts.indexOf(context) === -1) {
            console.error('Invalid kernel context: ' + context);
            process.exit();
        }

        const kernelClass = context.charAt(0).toUpperCase() + context.slice(1) + 'Kernel';
        const Kernel = require('./' + kernelClass);
        let projectPath;

        switch (context) {

            case 'build':
            case 'http':

                projectPath = path.dirname(path.join(require.main.filename, '..'));
                break;

            case 'cli':

                projectPath = process.cwd();
                break;
        }

        // override project path if it was passed in as an option
        if (typeof options.projectDirectory !== 'undefined') {
            projectPath = options.projectDirectory;
        }

        return new Kernel(projectPath, app, environment, options);
    }
};
