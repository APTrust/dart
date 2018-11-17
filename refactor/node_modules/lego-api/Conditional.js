const {ChainedMap} = require('chain-able')

const ObjectValues = obj => {
  if (Object.values) return Object.values(obj)
  const keys = Object.keys(obj)
  return keys.map(key => obj[key])
}

class Conditional extends ChainedMap {
  name(name) {
    return this.set('name', name.trim())
  }

  line(line) {
    return this.set('line', line)
  }

  isNested() {
    return this.parent !== null
  }

  // var conditions = {_global: true, _window: false}
  // var expression = `return ` + '_global && _window'
  // var keys = Object.keys(conditions)
  // var fn = new Function(keys, expression)
  // fn.apply(Object.values(conditions))
  /**
   * @desc get root parent,
   *       then split & check each name to ensure enabled,
   *       ...dun
   * @return {boolean}
   */
  isEnabled() {
    let parent = this.parent
    while (parent && parent.parent) {
      parent = parent.parent
    }

    var conditions = parent.get('conditions')
    var debug = parent.get('debug')

    const namespace = this.get('name').split('.')
    if (debug) {
      console.log(`parts: `, namespace)
    }

    const enabled =
      namespace.filter(name => {
        var expression = `return ` + (conditions[name] || name)
        var keys = Object.keys(conditions)
        var fn = new Function(keys, expression)
        const evaluation = fn.apply(undefined, ObjectValues(conditions))

        if (debug) {
          console.log(expression.replace('return', '') + ' ==', !!evaluation)
          console.log('\n')
        }

        if (evaluation) return true
        return false
      }).length === namespace.length

    return enabled
  }
}

Conditional.Conditional = Conditional
module.exports = Conditional
module.exports.default = module.exports
Object.defineProperty(module.exports, '__esModule', {value: true})
