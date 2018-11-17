const ChainedMap = require('../ChainedMap')
const camelCase = require('../deps/camel-case')
const {Primative} = require('../deps/symbols')

// https://www.youtube.com/watch?v=SwSle66O5sU
const OFF = `${~315 >>> 3}@@`

// @IDEA
// could use a factory function for each chain,
// exports a class that dynamically extends a specific class
// for easier chained inheritence

module.exports = (SuperClass = ChainedMap, opts) => {
  /**
   * @TODO could put this all in extendable
   * @see http://2ality.com/2015/09/well-known-symbols-es6.html
   * @IDEA extendDotProp (to allow doing like path.eh, path().eh(), path(), 'path.eh'!)
   * @classdesc simple object define extension
   * @type {Map}
   */
  return class DefineChain extends SuperClass {
    // @TODO!!!
    // getWhenSet() {
    //   this.set = (key, val) => {
    //     if (Object.hasOwnProprty(key) === false) {
    //       Object.defineProperty({
    //         configurable: true,
    //         enumerable: true,
    //         get() {
    //           return this.get(key)
    //         },
    //         set(setVal) {
    //           this.set(key, setVal)
    //         },
    //       })
    //     }
    //     return super.set(key, val)
    //   }
    // }

    /**
     * @TODO abstract this
     * @TODO this may break .from
     * @since 1.0.2
     * @desc add getter setter to methods
     *
     * @example
     *   // defining
     *   this.eh = val => this.set('eh', val)
     *   this.defineGetSet(['eh'])
     *
     *   // usage
     *   this.eh = true
     *   this.eh == true
     *   this.eh(true).eh() == true
     *
     * @param  {Array<string>} methods
     * @return {This} @chainable
     */
    defineGetSet(methods) {
      methods.forEach(method => {
        // reference current method, since we overwrite it
        const ref = this[method] && this[method].bind
          ? this[method].bind(this)
          : this[method]

        const getter = () => ref()

        // when arg is not passed in, count it as a getter
        // because `call` can be getter
        const setter = (arg = OFF) => {
          if (arg === OFF) return getter()
          return ref(arg)
        }

        // configurable
        Object.defineProperty(this, method, {
          configurable: true,
          enumerable: true,
          get: getter,
          set: setter,
        })
      })

      return this
    }

    /**
     * @desc add camelCased getX setX methods alongside the defined getSet
     * @since 1.0.2
     *
     * @example
     *  .extendGetSet(['eh'], this)
     *  -> setEh()
     *  -> .getEh,
     *  -> .eh {
     *      get(getter): getEh,
     *      set(setter): setEh
     *     }
     *
     * @example
     *  // usage
     *  this.extendGetSet(['ehOh'])
     *
     *  // with methods
     *  this.ehOh(true)
     *  this.ehOh() === this.getEhOh() === true
     *
     *  // with defined set and get + symbol toPrimative
     *  this.ehOh = false
     *  this.ehOh == false
     *  this.ehOh.valueOf() === false
     *
     * @param  {Array<string>}  methods
     * @param  {Object} thisArg
     * @return {This} @chainable
     */
    extendGetSet(methods, thisArg) {
      // @NOTE the variables when converted to a for loop have to be reassigned
      // and voided, so this is preferrable
      methods.forEach(method => {
        let getter
        let setter
        let name = typeof method === 'string' ? method : method.name

        // when we have method, use it, fallback to get/set
        /* prettier-ignore */
        getter = method.get
          ? arg => method.get(arg)
          : arg => this.get(name)

        // create the method beforehand to scope it, vs every call
        const sets = method.set
          ? (a, b, c) => method.set(a, b, c)
          : a => this.set(name, a)

        // when arg is not passed in, count it as a getter
        // because `call` can be getter
        setter = (a = OFF, b, c) => (a === OFF ? getter() : sets(a, b, c))

        // if this was hoisted it would be smaller
        this[camelCase(`get-${name}`)] = getter
        this[camelCase(`set-${name}`)] = setter
        this.shorthands.push(name)

        // also should have `setGet`
        Object.defineProperty(this, name, {
          configurable: true,
          enumerable: true,
          get: function getr(arg1) {
            const getrAsFn = (arg2 = OFF) => {
              return setter(arg2) // getter
            }
            getrAsFn[Primative] = hint => {
              return getter(OFF)
            }
            getrAsFn.valueOf = () => getter(OFF)
            return getrAsFn
          },
          set: function setr(arg1 = OFF, arg2 = OFF, arg3 = OFF) {
            return setter(arg1, arg2, arg3)
          },
        })
      })

      return this
    }
  }
}
