const {basename} = require('path')
const {inspector} = require('../modules/inspector-gadget')

// Stack trace format :
// https://github.com/v8/v8/wiki/Stack%20Trace%20API
let stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/i
let stackReg2 = /at\s+()(.*):(\d*):(\d*)/i

// ----------------------------- traces & stacks ------------------
// https://www.npmjs.com/package/parsetrace
// https://www.npmjs.com/package/debug-trace
// https://blog.risingstack.com/node-js-logging-tutorial/
// https://github.com/baryon/tracer
// https://www.npmjs.com/package/callsite
// http://www.devthought.com/2011/12/22/a-string-is-not-an-error/#beyond
// https://github.com/baryon/tracer#log-file-transport

// https://remysharp.com/2014/05/23/where-is-that-console-log
module.exports = {
  track() {
    return this.set('track', true)
  },

  /**
   * @tutorial https://github.com/fliphub/fliplog/blob/master/README.md#-find-logs
   * @return {FlipLog} @chainable
   */
  trackConsole() {
    const ops = ['log', 'warn']
    ops.forEach(method => {
      var old = console[method]
      console[method] = function() {
        var stack = new Error().stack.split(/\n/)
        // Chrome includes a single "Error" line, FF doesn't.
        if (stack[0].indexOf('Error') === 0) {
          stack = stack.slice(1)
        }
        var args = [].slice.apply(arguments).concat([stack[1].trim()])
        return old.apply(console, args)
      }
    })
    return this
  },

  /**
   * @tutorial https://github.com/fliphub/fliplog/blob/master/README.md#-find-logs
   * @see FlipLog.data, FlipLog.verbose
   * @return {FlipLog} @chainable
   */
  trace() {
    const e = new Error('log.trace')
    let stacklist = e.stack.split('\n').slice(2)
    let s = stacklist[0]
    let data = {}
    let sp = stackReg.exec(s) || stackReg2.exec(s)
    if (sp && sp.length === 5) {
      data.method = sp[1]
      data.path = sp[2]
      data.line = sp[3]
      data.pos = sp[4]
      data.file = basename(data.path)
      data.stackTrace = stacklist.map(stack => stack.replace(/\s+/, '')) // .join('\n')
      e.stack = data.stackTrace
    }

    // we use inspector here so we do not reformat the error in verbose
    return this.set('data', inspector(data))
  },

  /**
   * @tutorial https://github.com/fliphub/fliplog/blob/master/README.md#-find-logs
   * @see FlipLog.data, FlipLog.verbose
   * @return {FlipLog} @chainable
   */
  stack() {
    if (this.has('track') === false || this.get('track') === false) {
      return this
    }

    this.trace()

    // get call stack, and analyze it
    // get all file,method and line number
    let stacklist = new Error().stack.split('\n').slice(4)
    let s = stacklist[0]
    let data = {}
    let sp = stackReg.exec(s) || stackReg2.exec(s)
    if (sp && sp.length === 5) {
      data.method = sp[1]
      data.path = sp[2]
      data.line = sp[3]
      data.pos = sp[4]
      data.file = basename(data.path)
      // data.stack = stacklist.join('\n')
    }

    console.log(inspector(data))
    return this
  },
}
