const isPureObj = require('./is/pureObj')
const isRegExp = require('./is/regexp')
const isError = require('./is/error')
const isBoolean = require('./is/boolean')
const isNumber = require('./is/number')
const isString = require('./is/string')
const isDate = require('./is/date')

const isArray = Array.isArray
const objectKeys = Object.keys
const hasOwnProperty = (x, y) => Object.hasOwnProperty.call(x, y)

// https://github.com/substack/js-traverse
// @TODO: symbol
var traverse = function(obj) {
  return new Traverse(obj)
}
module.exports = traverse

function Traverse(obj) {
  this.value = obj
}

Traverse.prototype.get = function(ps) {
  var node = this.value
  for (var i = 0; i < ps.length; i++) {
    var key = ps[i]
    if (!node || !hasOwnProperty(node, key)) {
      node = undefined
      break
    }
    node = node[key]
  }
  return node
}

Traverse.prototype.has = function(ps) {
  var node = this.value
  for (var i = 0; i < ps.length; i++) {
    var key = ps[i]
    if (!node || !hasOwnProperty(node, key)) {
      return false
    }
    node = node[key]
  }
  return true
}

Traverse.prototype.set = function(ps, value) {
  var node = this.value
  for (var i = 0; i < ps.length - 1; i++) {
    var key = ps[i]
    if (!hasOwnProperty(node, key)) node[key] = {}
    node = node[key]
  }
  node[ps[i]] = value
  return value
}

Traverse.prototype.map = function(cb) {
  return walk(this.value, cb, true)
}

Traverse.prototype.forEach = function(cb) {
  this.value = walk(this.value, cb, false)
  return this.value
}

Traverse.prototype.reduce = function(cb, init) {
  var skip = arguments.length === 1
  var acc = skip ? this.value : init
  this.forEach(function(x) {
    if (!this.isRoot || !skip) {
      acc = cb.call(this, acc, x)
    }
  })
  return acc
}

Traverse.prototype.paths = function() {
  var acc = []
  this.forEach(function(x) {
    acc.push(this.path)
  })
  return acc
}

Traverse.prototype.nodes = function() {
  var acc = []
  this.forEach(function(x) {
    acc.push(this.node)
  })
  return acc
}

Traverse.prototype.clone = function() {
  var parents = [], nodes = []

  return (function clone(src) {
    for (var i = 0; i < parents.length; i++) {
      if (parents[i] === src) {
        return nodes[i]
      }
    }

    if (isPureObj(src)) {
      var dst = copy(src)

      parents.push(src)
      nodes.push(dst)

      forEach(objectKeys(src), key => {
        dst[key] = clone(src[key])
      })

      parents.pop()
      nodes.pop()
      return dst
    }
    else {
      return src
    }
  })(this.value)
}

function walk(root, cb, immutable) {
  var path = []
  var parents = []
  var alive = true

  return (function walker(node_) {
    var node = immutable ? copy(node_) : node_
    var modifiers = {}

    var keepGoing = true

    var state = {
      node,
      node_,
      path: [].concat(path),
      parent: parents[parents.length - 1],
      parents,
      key: path.slice(-1)[0],
      isRoot: path.length === 0,
      level: path.length,
      circular: null,
      update(x, stopHere) {
        if (!state.isRoot) {
          state.parent.node[state.key] = x
        }
        state.node = x
        if (stopHere) keepGoing = false
      },
      delete(stopHere) {
        delete state.parent.node[state.key]
        if (stopHere) keepGoing = false
      },
      remove(stopHere) {
        // @NOTE safety
        if (state.parent === undefined) {
          return
        }
        else if (isArray(state.parent.node)) {
          state.parent.node.splice(state.key, 1)
        }
        else {
          delete state.parent.node[state.key]
        }
        if (stopHere) keepGoing = false
      },
      keys: null,
      before(f) {
        modifiers.before = f
      },
      after(f) {
        modifiers.after = f
      },
      pre(f) {
        modifiers.pre = f
      },
      post(f) {
        modifiers.post = f
      },
      stop() {
        alive = false
      },
      block() {
        keepGoing = false
      },
    }

    if (!alive) return state

    function updateState() {
      if (isPureObj(state.node)) {
        if (!state.keys || state.node_ !== state.node) {
          state.keys = objectKeys(state.node)
        }

        state.isLeaf = state.keys.length == 0

        for (var i = 0; i < parents.length; i++) {
          if (parents[i].node_ === node_) {
            state.circular = parents[i]
            break
          }
        }
      }
      else {
        state.isLeaf = true
        state.keys = null
      }

      state.notLeaf = !state.isLeaf
      state.notRoot = !state.isRoot
    }

    updateState()

    // use return values to update if defined
    var ret = cb.call(state, state.node)
    if (ret !== undefined && state.update) state.update(ret)

    if (modifiers.before) modifiers.before.call(state, state.node)

    if (!keepGoing) return state

    if (isPureObj(state.node) && !state.circular) {
      parents.push(state)

      updateState()

      forEach(state.keys, (key, i) => {
        path.push(key)

        if (modifiers.pre) modifiers.pre.call(state, state.node[key], key)

        var child = walker(state.node[key])
        if (immutable && hasOwnProperty(state.node, key)) {
          state.node[key] = child.node
        }

        child.isLast = i == state.keys.length - 1
        child.isFirst = i == 0

        if (modifiers.post) modifiers.post.call(state, child)

        path.pop()
      })
      parents.pop()
    }

    if (modifiers.after) modifiers.after.call(state, state.node)

    return state
  })(root).node
}

function copy(src) {
  // require('fliplog').data(src).bold('copying').echo()
  if (isPureObj(src)) {
    var dst

    // const reduce = require('./reduce')
    // const toarr = require('./to-arr')
    // require('fliplog').underline('is obj').echo()
    // @TODO:
    // if (isMap(src)) {
    //   require('fliplog').underline('is map').echo()
    //   dst = reduce(src.entries())
    // }
    // else if (isSet(src)) {
    //   dst = toarr(src)
    // }
    if (isArray(src)) {
      dst = []
    }
    else if (isDate(src)) {
      dst = new Date(src.getTime ? src.getTime() : src)
    }
    else if (isRegExp(src)) {
      dst = new RegExp(src)
    }
    else if (isError(src)) {
      dst = {message: src.message}
    }
    else if (isBoolean(src)) {
      dst = new Boolean(src)
    }
    else if (isNumber(src)) {
      dst = new Number(src)
    }
    else if (isString(src)) {
      dst = new String(src)
    }
    else if (Object.create && Object.getPrototypeOf) {
      dst = Object.create(Object.getPrototypeOf(src))
    }
    else if (src.constructor === Object) {
      dst = {}
    }
    else {
      // @NOTE: only happens if above getPrototypeOf does not exist
      var proto = (src.constructor && src.constructor.prototype) ||
      src.__proto__ || {}
      var T = function() {}
      T.prototype = proto
      dst = new T()
    }

    forEach(objectKeys(src), key => {
      dst[key] = src[key]
    })
    return dst
  }
  else {
    // require('fliplog').red('is NOT OBJ').echo()
    return src
  }
}

/**
 * @TODO: unexpectedly breaks things iterating
 * if you are relying on internal functionality
 * (such as .path, .get, .value...) with map & set
 *
 * @desc if there is .forEach on the obj already, use it
 * otherwise, call function for each
 */
var forEach = function(xs, fn) {
  if (xs.forEach) return xs.forEach(fn)
  else for (var i = 0; i < xs.length; i++) fn(xs[i], i, xs)
}

forEach(objectKeys(Traverse.prototype), key => {
  traverse[key] = function(obj) {
    var args = [].slice.call(arguments, 1)
    var t = new Traverse(obj)
    return t[key].apply(t, args)
  }
})
