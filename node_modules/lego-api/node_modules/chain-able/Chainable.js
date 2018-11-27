// @TODO use build script with .replace for each
// const isNode =
//   typeof process === 'object' &&
//   typeof process.release === 'object' &&
//   process.release.name === 'node'
//
// if (isNode) {
//   module.exports = require('./Chainable.node')
// }
// else {
//   module.exports = require('./Chainable.all')
// }

const Iterator = require('./deps/symbols/iterator')
const Instance = require('./deps/symbols/instance')
const Primative = require('./deps/symbols/primative')

const F = Function.prototype

/**
 * @type {Chainable}
 * @prop {Chainable | any} parent
 * @prop {string} className
 * @prop {Array<Class|Object> | null} mixed
 */
class Chainable {
  /**
   * @param {Chainable | any} parent
   */
  constructor(parent) {
    if (parent) this.parent = parent
    this.className = this.constructor.name
  }

  /**
   * @NOTE assigned to a variable so buble ignores it
   * @since 0.5.0
   * @example for (var [key, val] of chainable) {}
   * @example
   *  * [Symbol.iterator](): void { for (const item of this.store) yield item }
   * @see https://github.com/sindresorhus/quick-lru/blob/master/index.js
   * @see https://stackoverflow.com/questions/36976832/what-is-the-meaning-of-symbol-iterator-in-this-context
   * @see this.store
   * @type {generator}
   * @return {Object} {value: undefined | any, done: true | false}
   */
  [Iterator]() {
    const entries = this.entries ? this.entries() : false
    const values = this.values()
    const size = this.store.size
    const keys = entries === false ? new Array(size) : Object.keys(entries)

    return {
      i: 0,
      next() {
        let i = this.i
        let key = i
        const val = values[i]
        if (entries) key = keys[i]

        // done - no more values, or iteration reached size
        if ((key === undefined && val === undefined) || size <= i) {
          return {value: undefined, done: true}
        }

        this.i++

        // return
        return {value: [key, val], done: false}
      },
    }
  }

  /**
   * @NOTE could just do chain.values().forEach...
   * @desc loop over values
   * @since 1.0.2
   * @param {Function} cb
   * @return {Chainable} @chainable
   */
  // forEach(cb) {
  //   this.values().forEach(cb, this)
  //   return this
  // }

  /**
   * @since 1.0.2
   * @desc
   *      checks mixins,
   *      checks prototype,
   *      checks if it has a store
   *      or parent or className
   *
   * @example new Chainable() instanceof Chainable
   * @type {Symbol.wellknown}
   * @param {Chainable | Object | any} instance
   * @return {boolean} instanceof
   */
  [Instance](instance) {
    return Chainable[Instance](instance, this)
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
   * @description
   *  when the condition is true,
   *  trueBrancher is called,
   *  else, falseBrancher is called
   *
   * @example
   *  const prod = process.env.NODE_ENV === 'production'
   *  chains.when(prod, c => c.set('prod', true), c => c.set('prod', false))
   *
   * @param  {boolean} condition
   * @param  {Function} [trueBrancher=Function.prototype] called when true
   * @param  {Function} [falseBrancher=Function.prototype] called when false
   * @return {ChainedMap}
   */
  when(condition, trueBrancher = F, falseBrancher = F) {
    if (condition) {
      trueBrancher(this)
    }
    else {
      falseBrancher(this)
    }

    return this
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
   * @example if (chain.has('eh') === false) chain.set('eh', true)
   * @param {any} value
   * @return {boolean}
   */
  has(value) {
    return this.store.has(value)
  }

  /**
   * @since 0.4.0
   * @NOTE: moved from ChainedMap and ChainedSet to Chainable @2.0.2
   * @NOTE: this was [...] & Array.from(this.store.values())
   * @see https://kangax.github.io/compat-table/es6/#test-Array_static_methods
   * @see https://stackoverflow.com/questions/20069828/how-to-convert-set-to-array
   * @desc spreads the entries from ChainedMap.store.values
   * @return {Array<any>}
   */
  values() {
    const vals = []
    this.store.forEach(v => vals.push(v))
    return vals
  }

  /**
   * @see http://2ality.com/2015/09/well-known-symbols-es6.html#default-tostring-tags
   * @since 1.0.2
   * @example chain + 1 (calls this)
   * @param {string} hint
   * @return {Primative}
   */
  [Primative](hint) {
    if (hint === 'number' && this.toNumber) {
      return this.toNumber()
    }
    else if (hint === 'string' && this.toString) {
      return this.toString()
    }
    else if (this.getContents !== undefined) {
      const content = this.getContents()
      if (typeof content === 'string') return content
    }

    // default:
    // if (this.valueOf) return this.valueOf(hint)
    const methods = [
      'toPrimative',
      'toNumber',
      'toArray',
      'toJSON',
      'toBoolean',
      'toObject',
    ]
    for (let m = 0; m < methods.length; m++) {
      if (this[methods[m]] !== undefined) {
        return this[methods[m]](hint)
      }
    }

    return this.toString()
  }
}

function define(Chain) {
  /**
   * @since 0.5.0
   * @example for (var i = 0; i < chain.length; i++)
   * @see ChainedMap.store
   * @return {number}
   */
  Object.defineProperty(Chain, 'length', {
    configurable: true,
    enumerable: false,
    get() {
      return this.store.size
    },
  })
  Object.defineProperty(Chain, Instance, {
    configurable: true,
    enumerable: false,
    // writable: false,
    value: (instance, thisArg) => {
      // @NOTE depreciated mixins because of speed, but will use this elsewhere
      // if (thisArg && thisArg.mixed !== undefined) {
      //   for (let m = 0; m < thisArg.mixed.length; m++) {
      //     const mixin = thisArg.mixed[m]
      //     if (mixin && typeof mixin === 'object' && instance instanceof mixin) {
      //       return true
      //     }
      //   }
      // }

      return (
        instance &&
        (Object.prototype.isPrototypeOf.call(instance, Chain) ||
          !!instance.className ||
          !!instance.parent ||
          !!instance.store)
      )
    },
  })
}

define(Chainable)
define(Chainable.prototype)

module.exports = Chainable
