/**
 * @since 2.0.0
 */
const dot = require('../deps/dot-prop')
const isDot = require('../deps/is/dot')
const getPathSegments = require('../deps/dot-segments')

/**
 * @desc checks if this._dot != false & isDot(key)
 * @see this.dot
 * @param  {string} key
 * @param  {DotProp} thisArg
 * @return {boolean}
 */
const shouldDot = (key, thisArg) => {
  return thisArg._dot !== false && isDot(key)
}

module.exports = (SuperClass, opts) => {
  return class DotProp extends SuperClass {
    /**
     * @param  {Boolean} [useDot=true]
     * @return {DotProp} @chainable
     */
    dot(useDot = true) {
      this._dot = useDot
      return this
    }

    /**
     * @inheritdoc
     * @see .dot
     * @desc since we have a map,
     *       we need to ensure the first property is available
     *       otherwise we have an empty map.entries obj
     *       which does nothing by reference
     */
    set(key, val) {
      if (shouldDot(key, this)) {
        const prop = key.split('.').shift()

        // we already know it is .dot, call super instead
        if (!super.has(prop)) super.set(prop, {})

        // spread
        const data = super.entries()

        // set on the spread data
        dot.set(data, key, val)

        // is already by ref, but be extra safe
        return super.set(prop, data[prop])
      }
      return super.set(key, val)
    }
    /**
     * @inheritdoc
     * @see .dot
     */
    get(key) {
      return shouldDot(key, this)
        ? dot.get(super.entries(), key)
        : super.get(key)
    }
    /**
     * @inheritdoc
     * @see .dot
     */
    has(key) {
      return shouldDot(key, this)
        ? dot.has(super.entries(), key)
        : super.has(key)
    }

    /**
     * @inheritdoc
     * @see .dot
     */
    delete(key) {
      return shouldDot(key, this)
        ? dot.delete(super.entries(), key)
        : super.delete(key)
    }

    /**
     * @desc returns a dot chain
     * @since 1.0.0
     * @param {string | null} [name=null]
     * @return {Object}
     */
    dotter(name = null) {
      if (name !== null) {
        // if (this.get('debug') === true) {
        //   console.log('chain:dotter:used-name', {name})
        // }
        return this._dotter(name)
      }

      return {
        name: dotName => this._dotter(dotName),
      }
    }

    /**
     * @protected
     * @since 1.0.0
     * @TODO split into a class
     * @see FlipChain.when
     * @desc take a dot-prop (or normal string) name
     *       returns an object with `.dotted` & `.otherwise`
     * @param  {string} name
     * @return {Object}
     */
    _dotter(name) {
      let value
      const dotted = {}
      const hasDot = isDot(name)

      // @NOTE: shifting the first one off will change accessor
      // @example moose.simple -> first: 'moose', accessor: ['simple']
      const accessor = hasDot ? getPathSegments(name) : false
      const first = accessor ? accessor.shift() : false

      dotted.dotted = cb => {
        if (hasDot === false) return dotted
        value = cb(first, accessor, name)
        return dotted
      }

      dotted.otherwise = cb => {
        if (hasDot === true) return dotted
        value = cb(name)
        return dotted
      }

      // chain it
      dotted.dotted.otherwise = dotted.otherwise

      dotted.value = () => {
        return value
      }

      return dotted
    }
  }
}
