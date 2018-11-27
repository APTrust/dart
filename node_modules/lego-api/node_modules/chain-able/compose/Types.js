const dopemerge = require('../deps/dopemerge')
const isString = require('../deps/is/string')
const isObj = require('../deps/is/pureObj')

module.exports = (SuperClass, opts) => {
  return class TypeChain extends SuperClass {
    /**
     * @since 1.0.0
     * @desc library of validators to use by name
     *       @modifies this.validators
     * @param  {Object} validators
     * @return {TypeChain} @chainable
     */
    validators(validators) {
      // icky but shorter: merge existing, or use variable
      /* prettier-ignore */
      return this
        .set('validators', this.has('validators') === true
          ? dopemerge(this.get('validators'), validators)
          : validators)
    }

    /**
     * @since 1.0.0
     * @desc add a validated function to do .set
     * @param  {string | null} [name=null] shorthand for .name
     * @return {FactoryChain} @chainable
     */
    typed(name = null) {
      const FactoryChain = require('../FactoryChain')
      const typed = new FactoryChain(this)

      const chain = typed
        .prop('type')
        .prop('name')
        .prop('onInvalid')
        .prop('onValid')
        .chainUpDown(this.typed)
        .chainUpDowns(['typed'])
        .onDone(data => {
          this.extendTyped(data.name, data.type, data.onInvalid, data.onValid)
        })

      // notNullType
      if (isString(name)) {
        chain.name(name)
        return chain
      }
      if (isObj(name)) {
        return chain.merge(name).end()
      }

      return chain
    }

    /**
     * @protected
     * @since 1.0.0
     * @desc extend a type
     * @param  {string} name
     * @param  {any} type
     * @param  {Function | null} [onInvalid=null]
     * @param  {Function | null} [onValid=null]
     * @return {This} @chainable
     */
    extendTyped(name, type, onInvalid = null, onValid = null) {
      this[name] = arg => {
        const typeError = () => {
          const errorMsg = `[typof: ${typeof name}, name: ${name}] was not of type ${type}`
          return new TypeError(errorMsg)
        }
        if (onInvalid === null) {
          onInvalid = e => {
            throw typeError()
          }
        }

        const validator = typeof type === 'string'
          ? this.get('validators')[type]
          : type

        if (typeof validator !== 'function') {
          // console.error({validators: this.get('validators')}, '\n\n')
          throw new TypeError(`${validator} for ${type} was not a function`)
        }

        let valid = true

        // @NOTE: should use `.encase` but we do not know this will inherit it
        // @TODO remove try catch unless `.encase` is used
        // try {
        valid = validator(arg)
        // }
        // catch (e) {
        // valid = e
        // }

        // if (this.get('debug') === true) {
        //   // console.log('validating: ', {valid, arg, name})
        // }

        // .error, .stack, === 'object'
        if (valid === null || valid === true) {
          this.set(name, arg)
          if (onValid !== null) onValid(arg, this, typeError())
        }
        else {
          onInvalid(arg, this)
        }
        return this
      }
      return this
    }
  }
}
