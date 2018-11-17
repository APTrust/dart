// core
const Chainable = require('./Chainable')
const ChainedMap = require('./ChainedMap')
const ChainedSet = require('./ChainedSet')
// merge
const MergeChain = require('./MergeChain')
const dopemerge = require('./deps/dopemerge')
const traverse = require('./deps/traverse')
// easy
const FactoryChain = require('./FactoryChain')
// composer
const compose = require('./compose')

// export
const exp = compose()
exp.init = parent => new exp(parent)
exp.Chain = exp
exp.compose = compose
exp.traverse = traverse
exp.toArr = require('./deps/to-arr')
exp.camelCase = require('./deps/to-arr')
exp.dot = require('./deps/dot-prop')
// exp.saw = require('./deps/chainsaw')

// function d(name, opts) {
//   Object.defineProperty(exp, name, {
//     configurable: true,
//     enumerable: false,
//     get() {
//       return Composer(opts)
//     },
//   })
// }
// d('Types', {types: true})

// core
exp.Chainable = Chainable
exp.ChainedSet = ChainedSet
exp.ChainedMap = ChainedMap
exp.FactoryChain = FactoryChain
// merge
exp.MergeChain = MergeChain
exp.dopemerge = dopemerge

module.exports = exp
