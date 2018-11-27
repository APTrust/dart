const dopemerge = require('./deps/dopemerge')
const ChainedMap = require('./ChainedMapExtendable')
const FactoryChain = require('./FactoryChain')

class TypeChainError extends Error {
  constructor(message) {
    super(message)
    this.name = this.constructor.name
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor)
    }
    else {
      this.stack = new Error(message).stack
    }
  }
}

class TypeChain extends ChainedMap {
  constructor(parent) {
    super(parent)
  }

  validators(validators) {
    if (this.has('validators')) {
      const merged = dopemerge(this.get('validators'), validators)
      return this.set('validators', merged)
    }
    return this.set('validators', validators)
  }

  /**
   * @desc add a validated function to do .set
   * @param  {string | null} [name=null] shorthand for .name
   * @return {FactoryChain} @chainable
   */
  typed(name = null) {
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

    if (name !== null && typeof name === 'string') {
      chain.name(name)
      return chain
    }
    if (name !== null && typeof name === 'object') {
      return chain.merge(name).end()
    }

    return chain
  }

  // or fn
  extendTyped(name, type, onInvalid = null, onValid = null) {
    this[name] = arg => {
      const typeError = () => {
        const errorMsg = `[typof: ${typeof name}, name: ${name}] was not of type ${type}`
        return new TypeChainError(errorMsg)
      }
      if (onInvalid === null) {
        onInvalid = e => {
          throw typeError()
        }
      }
      const validator = typeof type === 'string' ?
        this.get('validators')[type] :
        type

      if (typeof validator !== 'function') {
        console.error({validators: this.get('validators')}, '\n\n')
        throw new TypeChainError(`${validator} for ${type} was not a function`)
      }

      let valid = true

      try {
        valid = validator(arg)
      }
      catch (e) {
        valid = e
      }

      if (this.get('debug') === true) {
        // console.log('validating: ', {valid, arg, name})
      }

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
  }
}

TypeChain.TypeChain = TypeChain
module.exports = TypeChain
