// const timer = require('fliptime')
// this takes ~60 microseconds
// timer.start('is-node-webworker-web')

// http://stackoverflow.com/questions/4224606/how-to-check-whether-a-script-is-running-under-node-js
const isNode =
  typeof process === 'object' &&
  typeof process.release === 'object' &&
  process.release.name === 'node' &&
  typeof module !== 'undefined' &&
  typeof global === 'object'

// this.window = this // works
const isWeb = !!(typeof this === 'object' &&
  this.window &&
  this.window === this)

// http://stackoverflow.com/questions/7931182/reliably-detect-if-the-script-is-executing-in-a-web-worker
const isWebWorker =
  isNode === false &&
  typeof WorkerGlobalScope !== 'undefined' &&
  typeof self !== 'undefined' &&
  self instanceof WorkerGlobalScope // eslint-disable-line

// could be polyfil
const hasWindow = typeof window !== 'undefined'

// timer.stop('is-node-webworker-web').log('is-node-webworker-web')

module.exports = {
  isNode: isNode && !isWeb,
  isWeb,
  hasWindow,
  isWebWorker,
}
