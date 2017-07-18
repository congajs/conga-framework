/*
 * This file is part of the conga-framework module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

 /**
  * This is the base controller
  *
  * @author Marc Roulias <marc@lampjunkie.com>
  */
module.exports = class Controller {

    constructor(container) {
        this.container = container;
    }
}
