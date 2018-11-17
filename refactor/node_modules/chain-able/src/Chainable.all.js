/**
 * @type {Chainable}
 * @property {Chainable | any} parent
 */
class Chainable {
  /**
   * @param {Chainable | any} parent
   */
  constructor(parent: any) {
    this.parent = parent
  }

  /**
   * @since 0.4.0
   * @see Chainable.parent
   * @return {Chainable | any}
   */
  end(): Chainable | any {
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
    key: any,
    trueBrancher: Function = Function.prototype,
    falseBrancher: Function = Function.prototype
  ): Chainable {
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
    condition: boolean,
    trueBrancher: Function = Function.prototype,
    falseBrancher: Function = Function.prototype
  ): Chainable {
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
  get length(): number {
    return this.store.size
  }

  /**
   * @since 0.3.0
   * @return {Chainable}
   */
  clear(): Chainable {
    this.store.clear()
    return this
  }

  /**
   * @since 0.3.0
   * @description calls .delete on this.store.map
   * @param {string | any} key
   * @return {Chainable}
   */
  delete(key: any): Chainable {
    this.store.delete(key)
    return this
  }

  /**
   * @since 0.3.0
   * @param {any} value
   * @return {boolean}
   */
  has(value: any): boolean {
    return this.store.has(value)
  }
}

module.exports = Chainable
