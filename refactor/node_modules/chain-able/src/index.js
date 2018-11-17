// core
const ChainedMapExtendable = require('./ChainedMapExtendable')
const Chainable = require('./Chainable')
const ChainedMap = require('./ChainedMap')
const MergeChain = require('./MergeChain')
const ChainedSet = require('./ChainedSet')
// extended
const TypeChain = require('./TypeChain')
const ImmutableChain = require('./ImmutableChain')
const ChildChain = require('./ChildChain')
const dopemerge = require('./deps/dopemerge')

// export
const exp = TypeChain
exp.Chainable = Chainable
exp.ChainedSet = ChainedSet
exp.ChainedMap = ChainedMap
exp.MergeChain = MergeChain
exp.ChainedMapExtendable = ChainedMapExtendable
exp.Chain = TypeChain
exp.ImmutableChain = ImmutableChain
exp.ChildChain = ChildChain
exp.dopemerge = dopemerge
module.exports = exp
module.exports.default = module.exports
