const dopemerge = require('./deps/dopemerge')
const Chainable = require('./Chainable')

class MergeChain extends Chainable {
  /**
   * @param  {Chainable} parent required, for merging
   * @return {MergeChain} @chainable
   */
  static init(parent) {
    return new MergeChain(parent)
  }

  constructor(parent) {
    super(parent)
    this.store = new Map()
    this.set = (name, val) => {
      this.store.set(name, val)
      return this
    }
    this.get = name => this.store.get(name)
  }

  /**
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
   * @desc can pass in a function to check values, such as ignoring notReal
   * @example .onValue(val => val !== null && val !== undefined)
   * @param  {Function} cb
   * @return {MergeChain} @chainable
   */
  onValue(cb) {
    return this.set('onValue', cb)
  }

  /**
   * @desc merges object in, goes through all keys, checks cbs, dopemerges
   * @param  {Object} obj2 object to merge in
   * @return {MergeChain} @chainable
   */
  merge(obj2) {
    let onValue = this.get('onValue')
    let onExisting = this.get('onExisting')

    let obj = obj2

    // @TODO do this
    // if (obj2 instanceof Chainable) {
    //   // is map
    //   if (obj2.entries) obj2 = obj2.entries()
    //   // set, much easier to merge
    //   // else if (obj2.values)
    // }

    // const onChildChain = this.get('onChildChain') (is just .merge)
    // const onDefault = this.get('onDefault') (is .set)

    // for (let i = 0; i < keys.length; i++) const key = keys[i]
    Object.keys(obj).forEach(key => {
      const value = obj[key]

      // use onValue when set
      if (onValue !== undefined && onValue(obj[key], key) === false) {
        return false
      }

      // when property itself is a Chainable
      if (this.parent[key] && this.parent[key] instanceof Chainable) {
        return this.parent[key].merge(value)
      }

      // check if it is shorthanded
      if (this.parent.shorthands.includes(key)) {
        // has a value already
        if (this.parent.has(key) === true) {
          // get that value
          const existing = this.parent.get(key)

          // setup vars
          let merged = existing

          // if we have a cb, call it
          // default to dopemerge
          if (onExisting === undefined) {
            merged = dopemerge(existing, value)
          }
          else {
            merged = onExisting(existing, value)
          }

          return this.parent[key](merged)
        }

        return this.parent[key](value)
      }

      // when fn is a full method, not an extended shorthand
      if (this.parent[key] !== undefined) {
        return this.parent[key](value)
      }

      // default to .set on the store
      return this.parent.set(key, value)
    })

    return this.parent
  }
}

module.exports = MergeChain
