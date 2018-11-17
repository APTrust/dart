const ChainedMap = require('./ChainedMapExtendable')

let MAP = Map
// try {
//   require.resolve('immutable')
//   const immutablejs = require('immutable')
// }
// catch (e) {
//   // use normal map
// }

// @TODO:
//  - set the type to use,
//  - auto extend methods of that type
//  - do not spread args
// https://facebook.github.io/immutable-js/docs/#/Collection
class ImmutableChain extends ChainedMap {
  // @TODO not sure parent is best
  constructor(parent = new Map()) {
    super(parent)
    this.immutableStore = parent
  }

  delete(key: any): Chainable {
    if (this.immutableStore !== undefined) {
      this.immutableStore = this.immutableStore.delete(key)
    }

    super.delete(key)
    return this
  }

  set(key: any, value: any): Chainable {
    if (this.immutableStore !== undefined) {
      this.immutableStore = this.immutableStore.set(key, value)
    }
    super.set(key, value)
    return this
  }

  merge(obj: Object): Chainable {
    if (this.immutableStore !== undefined) {
      this.immutableStore = this.immutableStore.merge(obj)
    }
    super.merge(obj)
    return this
  }

  equals(obj): boolean {
    return this.immutableStore.equals(obj)
  }

  // getIn(...args) {
  //   return this.immutableStore.getIn(...args)
  // }
  // setIn(...args) {
  //   this.immutableStore = this.immutableStore.setIn(...args)
  //   return this
  // }
  // toJS(computed = false): boolean {
  //   return this.immutableStore.toJS(computed)
  // }
}

ImmutableChain.ImmutableChain = ImmutableChain
module.exports = ImmutableChain
