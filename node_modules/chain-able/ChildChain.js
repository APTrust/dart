const ChainedMap = require('./ChainedMapExtendable')

class ChildChain extends ChainedMap {
  constructor(parent) {
    super(parent)
    this.store = parent.store
    this.set = parent.set.bind(parent)
    this.get = parent._get.bind(parent)
    this.has = parent.has.bind(parent)
    // this.childStore = new Map()
  }
}

ChildChain.ChildChain = ChildChain
module.exports = ChildChain
