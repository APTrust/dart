/**
 * @since 2.0.0
 */

const encase = configs => (a, b, c, d, e) => {
  const {onValid, onInvalid, ref, rethrow} = configs
  let result
  try {
    result = ref(a, b, c, d, e)
    return onValid === 0 ? result : onValid(result)
  }
  catch (error) {
    if (onInvalid !== 0) return onInvalid(error)
    if (rethrow === true) throw error
    else return e
  }
}

module.exports = (SuperClass, opts) => {
  return class Shorthands extends SuperClass {
    // --- helpers  ---

    /**
     * @desc encase a method with try-catch easy chain
     * @param  {string}  method
     * @param  {boolean} [rethrow=false] or 1 to rechain?
     * @return {Shorthands} @chainable
     */
    encase(method, rethrow = false) {
      // const fn = typeof method === 'function'
      // or pass in a normal method...
      // let ref = fn ? method : this[method].bind(this)
      let ref = this[method].bind(this)

      const config = {
        onInvalid: 0,
        onValid: 0,
        rethrow,
        ref,
      }

      // @TODO improve this
      this.then = cb => {
        config.onValid = cb
        return this
      }
      this.catch = cb => {
        config.onInvalid = cb
        return this
      }

      // should be a child factory really...
      // if (fn !== false) {
      //   encased.call = () => encased.apply(this, arguments)
      //   encased.wrapped = () => {
      //     encased.apply(this, arguments)
      //     return this
      //   }
      //   encased.end = () => this
      //   return encased
      // }

      this[method] = encase(config)

      return this
    }

    /**
     * @TODO maybe just flow methods with a toFunction or something instead?
     * @since 1.0.2
     * @desc to allow flowing,
     * @param  {Array<string>} methods
     * @return {This} @chainable
     */
    bindMethods(methods) {
      methods.forEach(method => (this[method] = this[method].bind(this)))
      return this
    }

    /**
     * @desc wrap it simply to call a fn and return `this`
     * @since 1.0.2
     * @param  {string}   name
     * @param  {Function | null} [fn=null]
     * @return {This} @chainable
     */
    chainWrap(name, fn = null) {
      let ref = fn || this[name]
      this[name] = (a, b, c) => {
        ref.call(this, a, b, c)
        return this
      }
      return this
    }

    /**
     * @desc set if the value has not been set
     * @since 1.0.2
     * @see this.set
     * @param {string} name
     * @param {any} value
     * @return {This} @chainable
     */
    setIfEmpty(name, value) {
      // this.when(this.has(name) === false, () => this.set(name, value))
      if (this.has('name') === false) this.set(name, value)
      return this
    }

    // --- added new ChainedMapExtendable stuff ---

    /**
     * @since 1.0.2
     * @desc traverse `this`, or `this.entries`
     * @see TraverseChain
     * @see js-traverse
     * @param  {Function[]} funcs functions to flow left to right
     * @return {Function} passes args through the functions, bound to this
     */
    // flow(...funcs) {
    //   const length = funcs ? funcs.length : 0
    //   return (...args) => {
    //     let index = 0
    //     // eslint-disable-next-line
    //     let result = length ? funcs[index].apply(this, args) : args[0]
    //     for (; index < length; ++index) {
    //       // eslint-disable-next-line
    //       result = funcs[index].call(this, result)
    //     }
    //     return result
    //   }
    // }

    /**
     * @desc return a value at the end of a chain regardless
     * @param  {any} value value to return at the end of a chain
     * @return {any}
     */
    return(value) {
      return value
    }

    /**
     * @desc execute something and return this
     * @param  {any} fn
     * @return {This} @chainable
     */
    wrap(fn) {
      if (typeof fn === 'function') fn.call(this, this)
      return this
    }
  }
}
