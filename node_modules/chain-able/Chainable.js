// 

const isNode =
  typeof process === 'object' &&
  typeof process.release === 'object' &&
  process.release.name === 'node'

if (isNode) {
  module.exports = require('./Chainable.node')
}
else {
  module.exports = require('./Chainable.all')
}
