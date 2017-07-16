/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * The MemoryCommandOutput is a CommandOutput implementation which writes output
 * in to memory and provides methods to retrieve the output
 *
 * This can be used for tests to check the output
 */
module.exports = class MemoryCommandOutput {

    /**
     * Construct the MemoryCommandOutput
     */
    constructor() {
        this.lines = [];
    }

    /**
     * Write a line to the output
     *
     * @param  {String} line
     * @return {void}
     */
    writeln(line) {
        this.lines.push(line);
    }

    /**
     * Get a line by it's index
     *
     * @param  {Number} num
     * @return {String}
     */
    getLine(num) {
        return this.lines[num];
    }

    /**
     * Dump all of the output to the console
     *
     * @return {void}
     */
    dump() {
        this.lines.forEach((line) => {
            console.log(line);
        });
    }
}
