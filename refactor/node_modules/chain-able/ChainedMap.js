const Chainable = require('./Chainable')
const MergeChain = require('./MergeChain')

/**
 * @tutorial https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Map
 * @inheritdoc
 * @type {Chainable}
 */
class ChainedMap extends Chainable {
  /**
   * @param {ChainedMap | Chainable | any} parent
   */
  constructor(parent) {
    super(parent)
    this.shorthands = []
    this.store = new Map()
    this.className = this.constructor.name

    // @TODO for wrapping methods to force return `this`
    // this.chainableMethods = []
  }

  /**
   * @since 0.7.0
   * @see this.set, this.get
   * @desc   tap a value with a function
   *         @modifies this.store.get(name)
   * @param  {string | any} name key to `.get`
   * @param  {Function} fn function to tap with
   * @return {Chain} @chainable
   */
  tap(name, fn) {
    const old = this.get(name)
    const updated = fn(old)
    return this.set(name, updated)
  }

  /**
   * @TODO needs improvements like parsing stringify
   *       since it is just .merge atm
   *
   * @desc checks each property of the object
   *       calls the chains accordingly
   *
   * @param {Object} obj
   * @return {Chainable} @chainable
   */
  from(obj) {
    Object.keys(obj).forEach(key => {
      const fn = this[key]
      const value = obj[key]

      if (this[key] && this[key] instanceof Chainable) {
        return this[key].merge(value)
      }
      else if (typeof this[key] === 'function') {
        // const fnStr = typeof fn === 'function' ? fn.toString() : ''
        // if (fnStr.includes('return this') || fnStr.includes('=> this')) {
        return this[key](value)
      }
      else {
        this.set(key, value)
      }
    })
    return this
  }

  /**
   * @description shorthand methods, from strings to functions that call .set
   * @param  {Array<string>} methods
   * @return {ChainedMap}
   */
  extend(methods) {
    this.shorthands = methods
    methods.forEach(method => {
      this[method] = value => this.set(method, value)
    })
    return this
  }

  /**
   * @description
   *   clears the map,
   *   goes through this properties,
   *   calls .clear if they are instanceof Chainable or Map
   *
   *
   * @see https://github.com/fliphub/flipchain/issues/2
   * @return {ChainedMap}
   */
  clear() {
    this.store.clear()
    Object.keys(this).forEach(key => {
      if (key === 'inspect' || key === 'parent') return
      if (this[key] instanceof Chainable) this[key].clear()
      if (this[key] instanceof Map) this[key].clear()
    })

    return this
  }

  /**
   * @description spreads the entries from ChainedMap.store (Map)
   * @return {Object}
   */
  entries() {
    const entries = [...this.store]
    if (!entries.length) {
      return null
    }
    return entries.reduce((acc, [key, value]) => {
      acc[key] = value
      return acc
    }, {})
  }

  /**
   * @description spreads the entries from ChainedMap.store.values
   * @return {Array<any>}
   */
  values() {
    return [...this.store.values()]
  }

  /**
   * @param  {any} key
   * @return {any}
   */
  get(key) {
    return this.store.get(key)
  }

  /**
   * @description sets the value using the key on store
   * @see ChainedMap.store
   * @param {any} key
   * @param {any} value
   * @return {ChainedMap}
   */
  set(key, value) {
    this.store.set(key, value)
    return this
  }

  /**
   * @description concats an array `value` in the store with the `key`
   * @see ChainedMap.store
   * @param {any} key
   * @param {Array<any>} value
   * @return {ChainedMap}
   */
  concat(key, value) {
    if (!Array.isArray(value)) value = [value]
    this.store.set(key, this.store.get(value).concat(value))
    return this
  }

  /**
   * @description appends the string value to the current value at the `key`
   * @see ChainedMap.concat
   * @param {any} key
   * @param {string | Array} value
   * @return {ChainedMap}
   */
  append(key, value) {
    let existing = this.store.get(value)

    if (Array.isArray(existing)) {
      existing.push(value)
    }
    else {
      existing += value
    }

    this.store.set(key, existing)

    return this
  }

  /**
   * @TODO needs to pass in additional opts somehow...
   *       ...as second arg? on instance property?
   *
   * @description merges an object with the current store
   * @see dopemerge, MergeChain
   * @param {Object} obj
   * @return {ChainedMap} @chainable
   */
  merge(obj) {
    MergeChain.init(this).merge(obj)
    return this
  }

  /**
   * @description
   *  goes through the maps,
   *  and the map values,
   *  reduces them to array
   *  then to an object using the reduced values
   *
   * @param {Object} obj
   * @return {Object}
   */
  clean(obj) {
    return Object.keys(obj).reduce((acc, key) => {
      const value = obj[key]
      if (value === undefined || value === null) return acc
      if (Array.isArray(value) && !value.length) return acc
      if (
        Object.prototype.toString.call(value) === '[object Object]' &&
        Object.keys(value).length === 0
      ) {
        return acc
      }

      acc[key] = value

      return acc
    }, {})
  }
}

module.exports = ChainedMap
