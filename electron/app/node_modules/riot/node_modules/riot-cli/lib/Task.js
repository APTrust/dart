'use strict'

const
  helpers = require('./helpers'),
  path = require('path'),
  sh = require('shelljs'),
  compiler = global.compiler || require('riot-compiler'),
  constants = require('./const'),
  NO_FILE_FOUND = constants.NO_FILE_FOUND,
  PREPROCESSOR_NOT_REGISTERED = constants.PREPROCESSOR_NOT_REGISTERED

/**
 * Base class that will extended to handle all the cli tasks
 */
class Task {
  constructor(opt) {
    // Run only once
    /* istanbul ignore next */
    if (this.called) return
    this.called = true

    this.error = null

    // create a regex to figure out whether our user
    // wants to compile a single tag or some tags in a folder
    this.extRegex = new RegExp(`\\.${opt.ext || 'tag' }$`)

    // make sure the parsers object is always valid
    opt.parsers = helpers.extend(
      compiler.parsers,
      opt.parsers || {}
    )

    if (opt.compiler) {
      // validate the compiler options
      const err = this.validate(opt.compiler, opt.parsers)
      if (err) return this.handleError(err, opt.isCli)
    } else {
      // make sure to set always the compiler options
      opt.compiler = {}
    }

    if (opt.stdin) {
      if (opt.from) {
        helpers.log('Stdin will be used instead of the files/dirs specified.')
        delete opt.stdin
      }
    } else {
      // Resolve to absolute paths
      opt.from = path.resolve(opt.from)
      // Check if the path exsists
      if (!sh.test('-e', opt.from)) return this.handleError(NO_FILE_FOUND, opt.isCli)
    }

    if (opt.stdout) {
      if (opt.to) {
        helpers.log('Stdout will be used instead of the files/dirs specified.')
        delete opt.to
      }
    } else {
      // If no target dir, default to source dir
      const from = opt.from || ''
      opt.to = opt.to || (this.extRegex.test(from) ? path.dirname(from) : from)
      // Resolve to absolute paths
      opt.to = path.resolve(opt.to)
    }

    /**
     * Determine the input/output types
     * f: file
     * d: directory
     * s: stdin/stdout
     */
    const
      isFile = !opt.stdout && /\.(js|html|css)$/.test(opt.to),
      flowIn = opt.stdin ? 's' : this.extRegex.test(opt.from) ? 'f' : 'd',
      flowOut = opt.stdout ? 's' : opt.stdin || isFile ? 'f' : 'd'

    // 'ff', 'fd', 'fs', 'df', 'dd', 'ds', 'sf' or 'ss'
    // note that 'sd' is an imposible combination
    opt.flow = flowIn + flowOut

    if (opt.stdin && !opt.stdout && !isFile) {
      opt.to = path.join(opt.to, `output.${opt.export || 'js'}`)
      helpers.log(`Destination is rewrited: ${opt.to}`)
    }

    // each run method could return different stuff
    return this.run(opt)

  }

  /**
   * Check whether a parser has been correctly registered and It can be loaded
   * @param  { String }  type - parser scope html|javascript|css
   * @param  { String }  id - parser id, the require() call
   * @param  { Object }  parsers - custom parser options
   * @returns { String|Null }  get the error message when the parser can not be loaded
   */
  findParser(type, id, parsers) {
    var error
    // is it a default a default compiler parser?
    // if not check if it has bee manually registered
    if (!compiler.parsers[type][id] && !parsers[type][id])
      error = PREPROCESSOR_NOT_REGISTERED(type, id)
    else
      try {
        compiler.parsers._req(id, true)
      } catch (e) {
        error = e.toString()
      }

    return typeof error == 'string' ? error : null
  }

  /**
   * Validate the compiler options checking whether the local dependencies
   * are installed
   * @param { Object } opt - compiler options
   * @param { Object } parsers - custom parser options
   * @returns {String|Null} - false if there are no errors
   */
  validate(opt, parsers) {
    var template = opt.template,
      type = opt.type,
      style = opt.style,
      error = null

    if (template)
      error = this.findParser('html', template, parsers)
    if (type && !error)
      error = this.findParser('js', type, parsers)
    if (style && !error)
      error = this.findParser('css', style, parsers)

    return error
  }

  handleError(msg, isCli) {
    this.error = msg
    if (isCli) helpers.err(this.error)
    return this.error
  }
}

module.exports = Task
