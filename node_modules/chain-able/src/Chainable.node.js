const Chainable = require('./Chainable.all')

/**
 * @type {Chainable}
 * @property {Chainable | any} parent
 */
class ChainableNodeJS extends Chainable {
  /**
   * @param {Chainable | any} parent
   */
  constructor(parent: any) {
    super(parent)

    // https://www.bennadel.com/blog/2829-string-interpolation-using-util-format-and-util-inspect-in-node-js.htm
    this.inspect = moreFilters => {
      return function(depth, options) {
        let toInspect = Object.keys(thisArg).filter(
          key => !['parent', 'workflow'].includes(key)
        )

        let inspected = {}
        toInspect.forEach(key => (inspected[key] = thisArg[key]))
        return inspected
      }
    }
  }

  /**
   * @since 0.5.0
   * @type {generator}
   * @see https://github.com/sindresorhus/quick-lru/blob/master/index.js
   */
  // * [Symbol.iterator](): void {
  //   for (const item of this.store) {
  //     yield item
  //   }
  // }
}

module.exports = ChainableNodeJS
