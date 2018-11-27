/**
 * ChildChain
 */
module.exports = (SuperClass, opts) => {
  return class Child extends SuperClass {
    constructor(parent) {
      super(parent)
      this.store = parent.store
      this.set = parent.set.bind(parent)
      this.get = parent.get.bind(parent)
      this.has = parent.has.bind(parent)
    }
  }
}
