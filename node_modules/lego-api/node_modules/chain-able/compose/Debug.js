// @TODO
module.exports = (SuperClass, opts) => {
  class DebugChain extends SuperClass {
    // constructor(parent) {
    //   super(parent)
    //
    //   // www.bennadel.com/blog/2829-string-interpolation-using-util-format-and-util-inspect-in-node-js.htm
    //   // const inspector = (filters = []) => {
    //   //   const allProps = require('./deps/all-props')
    //   //   return function(depth, options) {
    //   //     let inspected = {}
    //   //
    //   //     /* prettier-ignore */
    //   //     allProps(this)
    //   //       .filter(key => !['parent', 'mixed', 'shorthands'].includes(key))
    //   //       .map(key =>
    //   //         inspected[key] = Object.getOwnPropertyDescriptor(this, key))
    //   //
    //   //     return inspected
    //   //   }
    //   // }
    //   // if (this.initializer !== undefined) this.initializer(parent)
    //   // this.inspect = () => inspector()
    // }

    /**
     * @inheritdoc
     * @override
     * @desc for inspecting
     * @since 1.0.1
     * @param  {Array<string> | Object} methods
     * @return {This} @chainable
     */
    clean(methods) {
      if (Array.isArray(methods) === false) {
        return super.clean(methods)
      }
      methods.forEach(method => {
        delete this[method]
        if (!this.parent || typeof this.parent !== 'object') return
        delete this.parent[method]
      })
      return this
    }
  }

  return DebugChain
}
