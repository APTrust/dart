const TraverseChain = require('../TraverseChain')
const isObj = require('../deps/is/obj')

module.exports = (SuperClass, opts) => {
  return class Transform extends SuperClass {
    // -------------------------------------------

    /**
     * @since 1.0.2
     * @desc traverse `this`, or `this.entries`
     * @see TraverseChain
     * @see js-traverse
     * @param  {boolean | traversable} [useThis=false]
     * @return {ChainedMapExtendable} @chainable
     */
    traverse(useThis = false) {
      /* prettier-ignore */
      return new TraverseChain(this)
        .obj(useThis === false
          ? this.entries(true)
          : useThis === true
            ? this
            : useThis
        )
    }

    // but could specify the key
    // could .tap methods with like .decorate
    // this is super expensive
    // afterNext(cb) {
    //   // loop each fn
    //   // wrap
    // }

    /**
     * @TODO dot-prop here
     * @since 1.0.2
     * @TODO handle transformers with an array...
     * @see obj-chain
     *
     * @example
     *   this
     *     .transform('dis', val => (typeof val === 'string' ? val : val.id))
     *     .set('dis', 'eh') // .get('dis') === 'eh'
     *     .set('dis', {id: 'eh'}) // .get('dis') === 'eh'
     *
     * @param  {string | Function} key currently just string
     * @param  {Function} value
     * @return {This} @chainable
     */
    transform(key, value) {
      if (this.transformers === undefined) this.transformers = {}
      if (this.transformers[key]) this.transformers[key].push(value)
      else this.transformers[key] = [value]
      return this
    }

    compute(key, cb) {
      return this.transform(key, value => {
        cb(value, this)
        return value
      })
    }

    /**
     * @TODO dot-prop here
     * @inheritdoc
     * @see this.observe, this.transform
     * @since 1.0.0
     */
    set(prop, val) {
      let value = val
      let key = prop

      /* prettier-ignore */
      if (this.transformers !== undefined && this.transformers[key] !== undefined) {
        for (let i = 0; i < this.transformers[key].length; i++) {
          value = this.transformers[key][i].call(this, value, this)
        }
      }

      super.set(key, value)

      if (this.observers !== undefined) {
        this.observers.values().forEach(observer => observer({key, value}))
      }

      return this
    }

    // --- remap ---

    /**
     * @TODO: could also be a function, but then might as well use .transform
     * @since 1.0.0
     * @example
     *  this
     *    .remapKeys()
     *    .remapKey('dis', 'dat')
     *    .from({dis: true})
     *  == {dat: true}
     *
     * @param  {string} from property name
     * @param  {string} to property name to change key to
     * @return {Chain} @chainable
     */
    remap(from, to) {
      let remap = from
      if (!isObj(from)) remap = {[from]: to}

      /* prettier-ignore */
      Object.keys(remap).forEach(key => this.transform(key, val => {
        this.set(remap[key], val)
        return val
      }))

      return this
    }
  }
}
