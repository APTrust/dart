const dopemerge = require('./deps/dopemerge')
const Chainable = require('./Chainable')
const isFunction = require('./deps/is/function')

/**
 * @since 1.0.0
 * @type {Map}
 */
class MergeChain extends Chainable {
  /**
   * @param  {Chainable} parent required, for merging
   * @return {MergeChain} @chainable
   */
  static init(parent) {
    return new MergeChain(parent)
  }

  /**
   * @inheritdoc
   */
  constructor(parent) {
    super(parent)
    this.store = new Map()
    this.set = (name, val) => {
      this.store.set(name, val)
      return this
    }

    this.set('onValue', () => true).set('merger', dopemerge)
    this.get = name => this.store.get(name)
  }

  /**
   * @since 1.0.0
   * @desc can pass in a function same as .merge,
   *       but say, .set instead of merge
   *
   * @param  {Function} cb
   * @return {MergeChain} @chainable
   */
  onExisting(cb) {
    return this.set('onExisting', cb)
  }

  /**
   * @since 1.0.1
   * @desc can pass in a function to check values, such as ignoring notReal
   * @example .onValue(val => val !== null && val !== undefined)
   * @param  {Function} cb
   * @return {MergeChain} @chainable
   */
  onValue(cb) {
    return this.set('onValue', cb)
  }

  /**
   * @since 1.0.2
   * @desc for using custom callback
   * @param  {Object} obj
   * @return {MergeChain} @chainable
   */
  obj(obj) {
    return this.set('obj', obj)
  }

  /**
   * @since 1.0.2
   * @desc options for merging with dopemerge
   *       @modifies this.merger | this.opts
   * @param  {Object | Function} opts
   * @return {MergeChain} @chainable
   *
   * @example
   * {
   *   stringToArray: true,
   *   boolToArray: false,
   *   boolAsRight: true,
   *   ignoreTypes: ['null', 'undefined', 'NaN'],
   *   debug: false,
   * }
   *
   * @example
   *  .merger(require('lodash.mergewith')())
   */
  merger(opts) {
    if (isFunction(opts)) return this.set('merger', opts)
    return this.set('opts', opts)
  }

  /**
   * @since 1.0.0
   *
   * @TODO issue here if we extend without shorthands &
   *       we want to merge existing values... :s
   *
   * @desc merges object in, goes through all keys, checks cbs, dopemerges
   * @param  {Object} obj2 object to merge in
   * @return {MergeChain} @chainable
   */
  merge(obj2) {
    const onExisting = this.get('onExisting')
    const onValue = this.get('onValue')
    const opts = this.get('opts') || {}
    const obj = this.has('obj') === true && !obj2 ? this.get('obj') : obj2 || {}
    const merger = this.get('merger')
    const sh = this.parent.shorthands || []
    const keys = Object.keys(obj)

    // @TODO do this
    // if (obj2 instanceof Chainable) {
    //   // is map
    //   if (obj2.entries) obj2 = obj2.entries()
    //   // set, much easier to merge
    //   // else if (obj2.values)
    // }
    // @TODO isEqual here?
    //
    // @NOTE
    // since this would be slower
    // if I want to not have a speedy default when using .onExisting
    // need to note to use .extend
    // when using chains without a class & doing .merge (edge-case)
    const handleExisting = (key, value) => {
      // when fn is a full method, not an extended shorthand
      const hasFn = isFunction(this.parent[key])
      const hasKey = this.parent.has(key)
      const set = (k, v) => (hasFn ? this.parent[k](v) : this.parent.set(k, v))

      // check if it is shorthanded
      // has a value already
      if (hasKey === true) {
        // get that value
        const existing = this.parent.get(key)

        // if we have a cb, call it
        // default to dopemerge
        if (onExisting === undefined) {
          // console.log('no onExisting', {existing, value, key})
          set(key, merger(existing, value, opts))
        }
        else {
          // maybe we should not even have `.onExisting`
          // since we can just override merge method...
          // and then client can just use a custom merger...
          //
          // could add and remove subscriber but that's overhead and ug
          // tricky here, because if we set a value that was just set...
          // console.log('has onExisting', {existing, value, key, onExisting})
          set(key, onExisting(existing, value, opts))
        }
      }
      else {
        set(key, value)
      }
    }

    for (let k = 0, len = keys.length; k < len; k++) {
      const key = keys[k]
      const value = obj[key]
      const method = this.parent[key]

      // use onValue when set
      if (!onValue(value, key, this)) {
        // console.log('used onValue returning false')
        continue
      }
      else if (method instanceof Chainable) {
        // when property itself is a Chainable
        this.parent[key].merge(value)
      }
      else if (method || sh.includes(key)) {
        // console.log('has method or shorthand')
        handleExisting(key, value)
      }
      else {
        // console.log('went to default')
        // default to .set on the store
        this.parent.set(key, value)
      }
    }

    return this.parent
  }
}

module.exports = MergeChain
