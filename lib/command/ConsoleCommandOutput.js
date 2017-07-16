/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * The ConsoleCommandOutput is a CommandOutput implementation which just
 * writes stuff out to the console
 */
module.exports = class ConsoleCommandOutput {

    /**
     * Write a line to the output
     *
     * @param  {String} line
     * @return {void}
     */
    writeln(line) {
        console.log(line);
    }
}
