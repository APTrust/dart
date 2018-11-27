const arrToObj = require('./deps/arr-to-obj')
const ChainedMap = require('./ChainedMap')
const Chainable = require('./Chainable')
const ChainedSet = require('./ChainedSet')
const toarr = require('./deps/to-arr')
const {firstToUpper, addPrefix, removePrefix} = require('./deps/prefix')

// @TODO: extendBool which would add `no` firstChar.toUpperCase() + rest()
//
// maybe was doing this to bind the prefix variable?
// this.extendWith(methods.map((method) => (0, addPrefix)(method, prefix)), !val, prefix)

/**
 * @inheritdoc
 */
class ChainedMapExtendable extends ChainedMap {
  constructor(parent) {
    super(parent)

    if (parent && parent.has && parent.has('debug')) {
      this.debug(parent.get('debug'))
    }
    else {
      this.debug(false)
    }
  }

  // --- added new ChainedMapExtendable stuff ---

  // to more easily use different chains,
  // simply loop and bind methods...
  // useChains(chains) {}

  // --- helpers  ---

  /**
   * @desc return a value at the end of a chain regardless
   * @param  {any} value value to return at the end of a chain
   * @return {any}
   */
  return(value) {
    return value
  }

  // --- observe ---

  /**
   * @TODO should hash these callback properties
   * @TODO just throttle the `.set` to allow easier version of .commit
   * @TODO .unobserve
   *
   * @see https://medium.com/@benlesh/learning-observable-by-building-observable-d5da57405d87
   * @alias  on
   * @param  {string} properties
   * @param  {Function} cb
   * @return {Chain} @chainable
   */
  observe(properties, cb) {
    if (this.observers === undefined) {
      this.observers = new ChainedSet(this)
    }

    /* prettier-ignore */
    this.observers
      .add(changed => {
        // @TODO
        //  use `changed` to simply only update data with changed
        //  keep scoped data
        //  const {key, value} = changed

        const data = {}
        const props = toarr(properties)
        for (let i = 0; i < props.length; i++) {
          const prop = props[i]
          data[prop] = this.get(prop)
        }
        cb(data, this)
      })

    return this
  }

  /**
   * @see this.observe
   * @inheritdoc
   */
  set(key, value) {
    super.set(key, value)

    if (this.observers !== undefined) {
      this.observers.values().forEach(observer => observer({key, value}))
    }

    return this
  }

  // --- remap ---

  /**
   * @desc start remapping
   * @see this.remapKey
   * @param  {Object} obj
   * @return {Chain} @chainable
   */
  remapKeys() {
    return this.set('keymap', {})
  }

  /**
   * @TODO could also be an array of `from` and corresponds to an array of `to`
   * @param  {string} from property name
   * @param  {string} to property name to change key to
   * @return {Chain} @chainable
   */
  remapKey(from, to) {
    this.get('keymap')[from] = to
    return this
  }

  /**
   * @inheritdoc
   * @override
   * @desc if we have a keymap, remap, otherwise, just normal .from
   * @see FlipChain.from
   * @param  {Object} obj
   * @return {Chain} @chainable
   */
  from(obj) {
    if (this.has('keymap') === false) {
      return super.from(obj)
    }

    const keymap = this.get('keymap')
    const keys = Object.keys(obj)
    const mappedKeys = keys.map(key => {
      if (keymap[key]) return keymap[key]
      return key
    })

    for (let i = 0; i < keys.length; i++) {
      const key = mappedKeys[i]
      // skip if we already have it
      if (obj[key]) continue
      // otherwise, set it, can delete the old one
      obj[key] = obj[keys[i]]
    }

    return super.from(obj)
  }

  /**
   * @desc returns a dot chain
   * @param {string | null} [name=null]
   * @return {Object}
   */
  dotter(name = null) {
    if (name !== null) {
      console.log('chain:dotter', 'used name')
      return this._dotter(name)
    }

    return {
      name: dotName => this._dotter(dotName),
    }
  }

  /**
   * @protected
   * @TODO split into a class
   * @see FlipChain.when
   * @desc take a dot-prop (or normal string) name
   *       returns an object with `.dotted` & `.otherwise`
   * @param  {string} name
   * @return {Object}
   */
  _dotter(name) {
    let accessor = name
    let first = name
    let hasDot = name.includes('.')
    let value

    if (hasDot) {
      accessor = name.split('.')
      first = accessor.shift()
    }

    const dotted = {}

    dotted.dotted = cb => {
      if (hasDot === false) return dotted
      value = cb(first, accessor, name)
      return dotted
    }

    dotted.otherwise = cb => {
      if (dotted === true) return dotted
      value = cb(name)
      return dotted
    }

    // chain it
    dotted.dotted.otherwise = dotted.otherwise

    dotted.value = () => value

    return dotted
  }

  // --- original ChainedMapExtendable ---

  /**
   * @inheritdoc
   * @override
   * @desc same as ChainedMap.get, but checks for debug
   */
  get(name) {
    if (name === 'debug') return this._debug
    return super.get(name)
  }

  /**
   * @NOTE sets on store not this.set for easier extension
   * @param {boolean} [should=true]
   * @return {Chainable} @chainable
   */
  debug(should = true) {
    this._debug = should
    return this
    // return this.store.set('debug', should)
  }

  /**
   * @see ChainedMapExtendable.parent
   * @param  {Array<Object>} decorations
   * @return {ChainedMapExtendable}
   */
  decorateParent(decorations) {
    if (!this.decorated) this.decorated = new ChainedMap(this.parent)

    decorations.forEach(decoration => {
      const method = decoration.method
      const returnee = decoration.return || this.parent
      const key = decoration.key || method
      this.parent[method] = data => {
        this.set(key, data)
        return returnee
      }
    })

    return this
  }

  /**
   * @FIXME @TODO needs thought
   * @param {string} name
   * @param {Object} Chain
   * @return {ChainedMapExtendable}
   */
  addChain(name, Chain) {
    // making name available as a property on chainable
    if (typeof name !== 'string') Chain = name
    const chained = new Chain(this)
    name = chained.name || name
    this[name] = chained
    this.chains.push(name)
    return this
  }

  // --- extend extend ---

  /**
   * @param  {Array<string>} methods
   * @param  {string}  name
   * @param  {Boolean} [thisArg=null]
   * @return {ChainedMap}
   */
  extendAlias(methods, name, thisArg = null) {
    methods.forEach(method => (this[method] = this[name].bind(thisArg || this)))
    return this
  }

  /**
   * @param {Array<string>} methods
   * @param {any} val
   * @param {string} [prefix='no']
   * @param {string} [inverseValue='todo']
   * @return {ChainedMapExtendable}
   */
  extendPrefixed(methods, val, prefix = 'no', inverseValue = 'todo') {
    this.extendWith(methods, val)
    this.extendWith(
      methods.map(method => addPrefix(method, prefix)),
      !val,
      prefix
    )
    return this
  }

  /**
   * @desc add methods for keys with default values,
   *       and inverse functions to set the value to the opposite
   * @param {Array<string>} methods
   * @param {any} val
   * @param {string} [prefix]
   * @return {ChainedMapExtendable}
   */
  extendWith(methods, val, prefix) {
    const objMethods = arrToObj(methods, val)
    const keys = Object.keys(objMethods)
    this.shorthands = [...this.shorthands, ...keys]
    keys.forEach(method => {
      // value = objMethods[method]
      this[method] = value => {
        if (value === undefined || value === null) value = val
        if (prefix) return this.set(removePrefix(method, prefix), value)
        return this.set(method, value)
      }
    })
    return this
  }

  // --- boolean & increment presets ---

  /**
   * @see ChainedMapExtendable.extendPrefixed
   * @param {Array<string>} methods
   * @param {any} val
   * @param {string} [prefix='no']
   * @return {ChainedMapExtendable}
   */
  extendBool(methods, val, prefix = 'no') {
    this.extendPrefixed(methods, !val, prefix)
    return this
  }

  /**
   * @see ChainedMapExtendable.extendWith
   * @param {Array<string>} methods
   * @return {ChainedMapExtendable}
   */
  extendFalse(methods) {
    this.extendWith(methods, false)
    return this
  }

  /**
   * @see ChainedMapExtendable.extendWith
   * @param {Array<string>} methods
   * @return {ChainedMapExtendable}
   */
  extendTrue(methods) {
    this.extendWith(methods, true)
    return this
  }

  /**
   * @description when called, increments the value
   * @param  {Array<string>} methods
   * @return {ChainedMap}
   */
  extendIncrement(methods) {
    // every time it is called, just increment
    // add to this.shorthands
    methods.forEach(method => {
      this.shorthands.push(method)
      this[method] = () => {
        let value = (this.get(method) | 0) + 1
        this.set(method, value)
        return this
      }
    })
    return this
  }

  /**
   * @description uses an object, loops through keys, adds method
   * @see ChainedMapExtendable.shorthands
   *
   * @param  {Object} methods
   * @return {ChainedMap}
   */
  extendDefault(methods) {
    this.shorthands = [...this.shorthands, ...methods]

    Object.keys(methods).forEach(method => {
      this[method] = (value = methods[method]) => this.set(method, value)
    })

    return this
  }
}

/**
 * @desc function callable ChainedMapExtendable
 * @param {Chainable | Object | null | *} [obj=null] parent when chainable, or `.from`
 * @param {Object | null | *} [from={}] `.from` when `obj` is `chainable`
 * @return {ChainedMapExtendable}
 */
function Chainables(obj = null, from = {}) {
  if (
    obj &&
    (obj instanceof Chainable ||
      obj instanceof Chainables ||
      obj.store !== undefined)
  ) {
    const chain = new ChainedMapExtendable(obj)
    if (from !== null) chain.from(from)
    return chain
  }
  return new ChainedMapExtendable().from(obj)
}

module.exports = ChainedMapExtendable
