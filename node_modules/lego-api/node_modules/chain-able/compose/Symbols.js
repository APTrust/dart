// putting it here allows buble to ignore it
const Iterator = require('../deps/symbols/iterator')
const Primative = require('../deps/symbols/primative')
const Instance = require('../deps/symbols/instance')

module.exports = (SuperClass, opts) => {
  class Symbols extends SuperClass {
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
     *      checks extensions,
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
      return Symbols[Instance](instance, this)
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
      // if (this.toType !== undefined) return this.toType(hint)

      if (this.toPrimative !== undefined) return this.toPrimative(hint)
      if (this.toNumber !== undefined) return this.toNumber(hint)
      if (this.toArray !== undefined) return this.toArray(hint)
      if (this.toJSON !== undefined) return this.toJSON(hint)
      if (this.toBoolean !== undefined) return this.toBoolean(hint)
      if (this.toObject !== undefined) return this.toObject(hint)

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
        if (!instance) return false

        // if (thisArg && thisArg.mixed !== undefined) {
        //   for (let m = 0; m < thisArg.mixed.length; m++) {
        //     const mixin = thisArg.mixed[m]
        //     if (
        //       mixin &&
        //       typeof mixin === 'object' &&
        //       instance instanceof mixin
        //     ) {
        //       return true
        //     }
        //   }
        // }
        return (
          Object.prototype.isPrototypeOf.call(instance, Chain) ||
          !!instance.className ||
          !!instance.parent ||
          !!instance.store
        )
      },
    })
  }

  define(Symbols)
  define(Symbols.prototype)
  return Symbols
}
