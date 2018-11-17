/**
 * @type {Chainable}
 * @property {Chainable | any} parent
 */
class Chainable {
  /**
   * @param {Chainable | any} parent
   */
  constructor(parent) {
    this.parent = parent
  }

  /**
   * @since 0.4.0
   * @see Chainable.parent
   * @return {Chainable | any}
   */
  end() {
    return this.parent
  }

  /**
   * @since 0.4.0
   * @param  {any} key
   * @param  {Function} [trueBrancher=Function.prototype]
   * @param  {Function} [falseBrancher=Function.prototype]
   * @return {ChainedMap}
   */
  whenHas(
    key,
    trueBrancher = Function.prototype,
    falseBrancher = Function.prototype
  ) {
    if (this.has(key) === true) {
      trueBrancher(this.get(key), this)
    }
    else {
      falseBrancher(false, this)
    }
    return this
  }

  /**
   * @description
   *  when the condition is true,
   *  trueBrancher is called,
   *  else, falseBrancher is called
   *
   * @param  {boolean} condition
   * @param  {Function} [trueBrancher=Function.prototype]
   * @param  {Function} [falseBrancher=Function.prototype]
   * @return {ChainedMap}
   */
  when(
    condition,
    trueBrancher = Function.prototype,
    falseBrancher = Function.prototype
  ) {
    if (condition) {
      trueBrancher(this)
    }
    else {
      falseBrancher(this)
    }

    return this
  }

  /**
   * @since 0.5.0
   * @see ChainedMap.store
   * @return {number}
   */
  get length() {
    return this.store.size
  }

  /**
   * @since 0.3.0
   * @return {Chainable}
   */
  clear() {
    this.store.clear()
    return this
  }

  /**
   * @since 0.3.0
   * @description calls .delete on this.store.map
   * @param {string | any} key
   * @return {Chainable}
   */
  delete(key) {
    this.store.delete(key)
    return this
  }

  /**
   * @since 0.3.0
   * @param {any} value
   * @return {boolean}
   */
  has(value) {
    return this.store.has(value)
  }
}

module.exports = Chainable
