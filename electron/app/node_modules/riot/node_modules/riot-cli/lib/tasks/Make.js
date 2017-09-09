'use strict'

const
  Task = require('../Task'),
  helpers = require('../helpers'),
  chalk = require('chalk'),
  compiler = global.compiler || require('riot-compiler'),
  path = require('path'),
  sh = require('shelljs'),
  co = require('co'),
  constants = require('./../const'),
  START_FRAG = constants.MODULAR_START_FRAG,
  END_FRAG = constants.MODULAR_END_FRAG

/**
 * Compile the tags using the riot-compiler
 */
class Make extends Task {
  run(opt) {
    // Generate a list of input/output files
    const
      isStdin = opt.flow[0] == 's',
      isStdout = opt.flow[1] == 's',
      isInputFile = opt.flow[0] == 'f',
      isOutputFile = opt.flow[1] == 'f',
      from = isStdin ? null
        : isInputFile ? [opt.from]
        : helpers.find(this.extRegex, opt.from),
      base = isStdin ? process.cwd
        : isInputFile ? path.dirname(opt.from)
        : opt.from,
      to = isStdout ? null
        : isOutputFile ? [opt.to]
        : helpers.remap(this.extRegex, from, opt.to, base, opt.export)

    // Create any necessary dirs
    if (!isStdout) to.forEach(f => sh.mkdir('-p', path.dirname(f)))

    // extend the compiler parsers
    if (opt.parsers)
      helpers.extend(compiler.parsers, opt.parsers)

    // Process files
    if (isStdout)
      this.toStdout(from, opt)
    else if (isOutputFile)
      this.toFile(from, to, opt)
    else
      this.toDir(from, to, opt)

    /**
     * Print what's been done (unless --silent)
     * note that opt.compiler.silent is always true when opt.stdout is true
     */
    /* istanbul ignore next */
    if (!opt.compiler.silent) {
      (from || [false]).forEach((src, i) => {
        helpers.log(
          chalk.blue(!src ? 'stdin' : helpers.toRelative(src)) +
          chalk.cyan(' -> ') +
          chalk.green(helpers.toRelative(to[i] || to[0]))
        )
      })
    }

    return true
  }

  /**
   * Write all the tags compiled in a single file on the file system
   * @param { Array } from - source files array
   * @param { Object } opt - cli options
   * @returns { Promise } resolves when compilation has done
   */
  toStdout(from, opt) {
    return co(function* () {
      const compiled = from
        ? from.map(f => parse(helpers.readFile(f), opt, f)).join('\n')
        : parse(yield helpers.readStdin(), opt, '')
      const wrapped = encapsulate(compiled, opt)

      // Output to stdout
      process.stdout.write(wrapped)
    })
  }

  /**
   * Write all the tags compiled in a single file on the file system
   * @param { Array } from - source files array
   * @param { String } to - output path
   * @param { Object } opt - cli options
   * @returns { Promise } resolves when compilation has done
   */
  toFile(from, to, opt) {
    return co(function* () {
      const compiled = from
        ? from.map(f => parse(helpers.readFile(f), opt, f)).join('\n')
        : parse(yield helpers.readStdin(), opt, '')
      const wrapped = encapsulate(compiled, opt)

      // Save to a file
      sh.ShellString(wrapped).to(to[0])
    })
  }

  /**
   * Write all the tags compiled in several files on the file system
   * @param   { Array } from - source files array
   * @param   { Array } to - output folder
   * @param   { Object } opt - cli options
   */
  toDir(from, to, opt) {
    from.forEach((f, i) => {
      const compiled = parse(helpers.readFile(f), opt, f)
      const wrapped = encapsulate(compiled, opt)
      sh.ShellString(wrapped).to(to[i])
    })
  }
}

/**
 * Compile the source files using the riot-compiler
 * @param { String } tag - tag source
 * @param { Object } opt - cli options
 * @param { String } url - tag file path
 * @returns { String } riot-compiler output
 */
function parse (tag, opt, url) {
  let out
  try {
    out = compiler.compile(tag, opt.compiler, url)
  } catch (e) {
    helpers.err(e)
  }
  // take only the css
  if (opt.export)
    return out.reduce((prev, curr) => prev + curr[opt.export], '')
  else return out
}

/**
 * Wrap the generated tags using a default UMD wrapper
 * @param { String } from - source files array
 * @param { Object } opt - cli options
 * @returns { String } wrapped output
 */
function encapsulate (from, opt) {
  return !opt.compiler.modular ? from : `${START_FRAG}${from}${END_FRAG}`
}

module.exports = Make
