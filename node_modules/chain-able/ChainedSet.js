const Chainable = require('./Chainable')

/**
 * @tutorial https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
 * @type {Set}
 */
class ChainedSet extends Chainable {
  /**
   * @param {ChainedSet | Chainable | any} parent
   */
  constructor(parent) {
    super(parent)
    this.store = new Set()
  }

  /**
   * @param {any} value
   * @return {ChainedSet}
   */
  add(value) {
    this.store.add(value)
    return this
  }

  /**
   * @description inserts the value at the beginning of the Set
   * @param {any} value
   * @return {ChainedSet}
   */
  prepend(value) {
    this.store = new Set([value, ...this.store])
    return this
  }

  /**
   * @return {Array<any>}
   */
  values() {
    return [...this.store]
  }

  /**
   * @param {Array | Set} arr
   * @return {ChainedSet}
   */
  merge(arr) {
    this.store = new Set([...this.store, ...arr])
    return this
  }
}

module.exports = ChainedSet
