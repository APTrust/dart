const ChainedSet = require('./ChainedSet')
const ChainedMap = require('./ChainedMapExtendable')

class FactoryChain extends ChainedMap {
  constructor(parent) {
    super(parent)

    this.data = {}
    this.factory()
    super.extend(['optional', 'required', 'chainUpDown'])
    super.extendIncrement(['chainLength'])
    this._calls = new ChainedSet(this)
  }

  // chain back up to parent for any of these
  // should have a debug log for this
  chainUpDowns(methods) {
    methods.forEach(method => {
      this[method] = (arg1, arg2, arg3, arg4, arg5) => {
        this.end()
        return this.parent[method](arg1, arg2, arg3, arg4, arg5)
      }
    })
    return this
  }

  _call(name) {
    this._calls.add(name)
    return this
  }

  extend(props) {
    super.extend(props)
    return this
  }

  props(names) {
    names.forEach(name => this.prop(name))
    return this
  }

  onDone(cb) {
    return this.set('onDone', cb)
  }

  magicReturn() {
    if (this._calls.length === this.get('chainLength')) {
      return this.end()
    }
    return this
  }

  prop(name, cb = null) {
    this.chainLength()

    // so if we call a property twice,
    // chain back up to parent,
    // add a new chain
    if (this[name] !== undefined && this.has('chainUpDown') === true) {
      this.end()
      return this.get('chainUpDown')()[name](cb)
    }

    // @TODO need to spread as needed
    this[name] = args => {
      if (cb !== null) cb(args)
      else this.data[name] = args

      this._call(name)

      return this.magicReturn()
    }
    return this
  }

  getData(prop = null) {
    if (prop !== null) {
      return this.data[prop]
    }
    return this.data
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

FactoryChain.FactoryChain = FactoryChain
module.exports = FactoryChain
