const ChainedSet = require('./ChainedSet')
const compose = require('./compose')

const Composed = compose({extend: true})

/**
 * @inheritdoc
 * @prop {Object} data
 * @prop {Set} _calls
 * @type {Map}
 */
class FactoryChain extends Composed {
  constructor(parent) {
    super(parent)

    this.data = {}
    this.factory()
    super.extend(['optional', 'required', 'chainUpDown']).set('chainLength', 0)
    // super.extendIncrement(['chainLength'])
    this._calls = new ChainedSet(this)
  }

  /**
   * @TODO should have a debug log for this
   * @desc chain back up to parent for any of these
   * @param  {Array<string>} methods
   * @return {FactoryChain} @chainable
   */
  chainUpDowns(methods) {
    methods.forEach(m => {
      this[m] = (arg1, arg2, arg3, arg4, arg5) => {
        this.end()
        return this.parent[m](arg1, arg2, arg3, arg4, arg5)
      }
    })
    return this
  }

  // extend(props) {
  //   super.extend(props)
  //   return this
  // }

  props(names) {
    names.forEach(name => this.prop(name))
    return this
  }

  onDone(cb) {
    return this.set('onDone', cb)
  }

  prop(name, cb = null) {
    this.tap('chainLength', len => len + 1)

    // console.log({name}, this.get('chainLength'))

    // so if we call a property twice,
    // chain back up to parent,
    // add a new chain
    if (this[name] !== undefined && this.has('chainUpDown') === true) {
      this.end()
      return this.get('chainUpDown')()[name](cb)
    }

    // @TODO need to spread as needed
    this[name] = args => {
      if (cb === null) this.data[name] = args
      else cb(args)

      this._calls.add(name)

      // aka magicReturn
      return this._calls.length === this.get('chainLength') ? this.end() : this
    }
    return this
  }

  /**
   * @param  {any} [prop=null] key of the data, or returns all data
   * @return {any}
   */
  getData(prop = null) {
    return prop === null ? this.data : this.data[prop]
  }

  factory(obj = {}) {
    this.end = arg => {
      if (obj.end !== undefined) {
        const ended = obj.end(this.data, this.parent, this, arg)
        if (ended && ended !== this) return ended
      }
      else if (this.has('onDone')) {
        const ended = this.get('onDone')(this.data, this.parent, this, arg)
        if (ended && ended !== this) return ended
      }

      return this.parent
    }

    return this
  }
}

module.exports = FactoryChain
