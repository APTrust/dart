/**
 * @since 2.0.0
 */

const ChainedMap = require('../ChainedMap')
const toarr = require('../deps/to-arr')
const isObj = require('../deps/is/pureObj')
// const {addPrefix, removePrefix} = require('../deps/prefix')

function getDecoration(decoration) {
  const method = isObj(decoration)
    ? Object.keys(decoration).pop()
    : decoration.method || decoration

  return {
    method,
    returnee: decoration.return,
    key: decoration.key || method,
    cb: isObj(decoration) ? decoration[method] : null,
  }
}

/**
 * @inheritdoc
 */
module.exports = (SuperClass = ChainedMap, opts) => {
  return class Extendable extends SuperClass {
    constructor(parent) {
      super(parent)

      // this.methodsAlias = this.extendAlias.bind(this)
      // this.methodsWith = this.extendWith.bind(this)
      // this.methodsAutoIncrement = this.extendIncrement.bind(this)

      if (parent && parent.has && parent.has('debug')) {
        this._debug = parent.get('debug')
        // this.debug(parent.get('debug'))
      }
      else {
        // this._debug = false
        this.debug(false)
      }
    }

    // --- --- --- debug --- --- ---

    /**
     * @since 1.0.0
     * @inheritdoc
     * @override
     * @desc same as ChainedMap.get, but checks for debug
     */
    get(name) {
      if (name === 'debug') return this._debug
      return super.get(name)
    }
    /**
     * @since 0.2.0
     * @NOTE sets on store not this.set for easier extension
     * @param {boolean} [should=true]
     * @return {Chainable} @chainable
     */
    debug(should = true) {
      this._debug = should
      return this
      // return this.store.set('debug', should)
    }

    // --- original ChainedMap ---

    /**
     * @since 1.0.0
     * @alias extendParent
     * @desc add methods to the parent for easier chaining
     * @see ChainedMap.parent
     * @param  {Array<string | Object>} decorations
     * @return {ChainedMap} @chainable
     */
    decorateParent(decorations) {
      // can use this to "undecorate"
      if (this.parent && !this.parent.decorated) {
        this.parent.decorated = this.parent.decorated || []
      }

      decorations.forEach(decoration => {
        // console.log({method, key}, 'parent decorations')
        let {method, cb, returnee, key} = getDecoration(decoration)

        // @NOTE ignores when no parent
        if (!returnee && !this.parent) {
          // if (this.get('debug') === true) {
          //   console.log('had no parent: ', method, this.className)
          // }
          return
        }

        this.parent.decorated.push(method)
        this.parent[method] = (arg1, arg2, arg3) => {
          cb = cb || this[method]
          let result
          if (cb) result = cb.call(this, arg1, arg2, arg3)
          else this.set(key, arg1)
          return returnee || result || this.parent || this
        }
      })

      return this
    }

    // --- extend extend ---

    /**
     * @since 0.4.0
     * @param  {Array<string>} methods
     * @param  {string}  name
     * @param  {Boolean} [thisArg=null]
     * @example
     *  chain.extendAlias(['eh'], 'canada')
     *  chain.eh == chain.canada
     * @return {ChainedMap}
     */
    extendAlias(methods, name, thisArg = null) {
      /* prettier-ignore */
      toarr(methods)
        .forEach(method => (this[method] = this[name].bind(thisArg || this)))

      return this
    }

    /**
     * @desc add methods for keys with default values, or val as default value
     * @param {Array<string> | Object} methods
     * @param {any} [val='undefined']
     * @return {ChainedMap} @chainable
     */
    extendWith(methods, val = undefined) {
      const isArr = Array.isArray(methods)
      const keys = isArr ? methods : Object.keys(methods)

      keys.forEach(method => {
        this.shorthands.push(method)
        const v = isArr === false ? methods[method] : val
        this[method] = (value = v) => this.set(method, value)
      })
      return this
    }

    // --- boolean & increment presets ---

    /**
     * @since 0.4.0
     * @desc when called, increments the value
     * @example this.extendIncrement(['eh']).eh().eh().eh().get('eh') === 3
     * @param  {Array<string>} methods
     * @return {ChainedMap}
     */
    extendIncrement(methods) {
      methods.forEach(method => {
        this.shorthands.push(method)
        this[method] = () => {
          let value = (this.get(method) || 0) + 1
          this.set(method, value)
          return this
        }
      })
      return this
    }
  }
}
