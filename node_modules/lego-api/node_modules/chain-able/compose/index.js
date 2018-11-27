const ChainedMap = require('../ChainedMap')
const isClass = require('../deps/is/class')
const Define = require('./Define')
const Observe = require('./Observe')
const Shorthands = require('./Shorthands')
const Transform = require('./Transform')
const Types = require('./Types')
const DotProp = require('./DotProp')
const Extend = require('./Extend')

// @TODO child, immutable, Symbols (take out of Chainable)
// const Symbols = require('./Symbols')

// optimize this as much as possible
function compose(SuperClass = ChainedMap, o = true) {
  let composed = SuperClass
  let opts = o
  if (opts === true) {
    // single arg
    if (typeof composed === 'object' && isClass(composed) === false) {
      opts = composed
      composed = ChainedMap
      // require('fliplog').bold('was not a class').data(composed, opts).exit()
    }
    else {
      opts = {
        symbols: true,
        define: true,
        observe: true,
        shorthands: true,
        transform: true,
        types: true,
        dot: true,
        extend: true,
      }
    }
  }
  else {
    opts = {}
  }

  // if (opts.symbols === true) composed = Symbols(composed)
  if (opts.extend === true) composed = Extend(composed)
  if (opts.define === true) composed = Define(composed)
  if (opts.observe === true) composed = Observe(composed)
  if (opts.shorthands === true) composed = Shorthands(composed)
  if (opts.transform === true) composed = Transform(composed)
  if (opts.types === true) composed = Types(composed)
  if (opts.dot === true) composed = DotProp(composed)

  return composed
}

// compose.Symbols = Symbols
compose.Extend = Extend
compose.Define = Define
compose.Observe = Observe
compose.Shorthands = Shorthands
compose.Transform = Transform
compose.Types = Types
compose.DotProp = Types

module.exports = compose
