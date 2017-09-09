'use strict'

const
  TEMP_FILE_NAME = require('./const').TEMP_FILE_NAME, // skip temporary files (created by editors), e.g. /.name.tag, /~name.tag, /name~.tag
  path = require('path'),
  rollup = require('rollup'),
  chalk = require('chalk'),
  sh = require('shelljs')

module.exports = {
  /**
   * Read from Stdin
   * @returns { String } captured lines from stdin
   */
  readStdin() {
    return new Promise((resolve, reject) => {
      try {
        let str = ''
        process.stdin.setEncoding('utf8')
        process.stdin.on('readable', () => { str += process.stdin.read() || '' })
        process.stdin.on('end', () => { resolve(str) })
      } catch (err) {
        reject(err)
      }
    })
  },

  /**
   * Read from a file
   * @param { String } from - file path
   * @returns { String } captured lines from stdin
   */
  readFile(from) {
    return sh.cat(from).toString().replace(/^\uFEFF/g, /* strips BOM */'')
  },

  /**
   * Find any file in certain folder
   * @param   { RegExp } extRegex - regular expression containing the file extension
   * @param   { String } from - files path
   * @returns { Array } array containing the files found
   */
  find(extRegex, from) {
    return sh
            .find(from)
            .filter((f) => extRegex.test(f) && TEMP_FILE_NAME.test(f))
  },

  /**
   * Loop files paths strings contained in an array remapping them to a different location
   * @param   { RegExp } extRegex - regular expression containing the file extension
   * @param   { Array } from - array contains paths where the files are located
   * @param   { String } to - path where the new files must be created
   * @param   { String } base - base path
   * @param   { String } ext - base path
   * @returns { Array } array containing all the paths to the new files that must be created
   */
  remap(extRegex, from, to, base, ext) {
    return from.map(from => {
      const p = path.relative(base, from).replace(extRegex, `.${ext || 'js'}`)
      return path.join(to, p)
    })
  },

  /**
   * Relative path to where the command line gets executed
   * @param   { String } path - the whole file path where a file is located on the machine
   * @returns { String } path relative to the current folder where the command line gets executed
   */
  toRelative(path) {
    return path.replace(sh.pwd().toString() + '/', '')
  },

  /**
   * Extend any object with other properties
   * @param   { Object } src - source object
   * @returns { Object } the resulting extended object
   *
   * var obj = { foo: 'baz' }
   * extend(obj, {bar: 'bar', foo: 'bar'})
   * console.log(obj) => {bar: 'bar', foo: 'bar'}
   *
   */
  extend(src) {
    var obj, args = arguments
    for (var i = 1; i < args.length; ++i) {
      if (obj = args[i]) {
        for (var key in obj) {
          if (typeof obj[key] === 'object' && typeof src[key] === 'object')
            src[key] = this.extend(src[key], obj[key])
          else if (typeof obj[key] !== 'undefined')
            src[key] = obj[key]
        }
      }
    }
    return src
  },

  /**
   * Try to read the option from a file
   * @param   { String } src - path to the config file
   * @returns { Object } cli options options
   */
  loadConfigFile(src) {
    src = path.resolve(src)

    // add the extension if it's missing
    if (src.slice(-3) !== '.js') src += '.js'

    // borrowed from the rollup cli
    // https://github.com/rollup/rollup/blob/master/bin/runRollup.js
    return rollup.rollup({
      entry: src,
      onwarn: (warning) => {
        if (warning.code === 'UNRESOLVED_IMPORT') return
        this.log(warning.message)
      }
    }).then((bundle) => {
      var
        opts,
        code = bundle.generate({
          format: 'cjs'
        }).code,
        // temporarily override require
        jsLoader = require.extensions['.js']


      require.extensions['.js' ]= function(m, filename) {
        if (filename === src) m._compile(code, filename)
        else jsLoader(m, filename)
      }

      try {
        opts = require(src)
      } catch (err) {
        this.err(err)
      }

      require.extensions['.js'] = jsLoader

      return opts

    }).catch((err) => {
      this.log('It was not possible to load your config file, are you sure the path is correct?')
      this.err(err)
    })

  },
  /**
   * Helper to output stuff in the terminal
   * @param   { * } msg - normally this should be a string
   */
  log(msg) {
    /* istanbul ignore next */
    if (global.isSilent) return
    console.log(msg)
  },
  /**
   * Throw an error and kill the process
   * @param   { String } msg - error message
   */
  err(msg) {
    msg += '\n'
    /* istanbul ignore next */
    if (!global.isSilent) process.stderr.write(chalk.red(msg)) && process.exit(1)
    else throw msg
  },
  /**
   * Get the current riot-cli release
   * @returns { String } this should always return the riot version in use unless riot-cli gets used as standalone module
   */
  getVersion() {
    return `
  riot-cli:      ${require('../package.json').version} - https://github.com/riot/cli
  riot-compiler: ${require('riot-compiler/package.json').version} - https://github.com/riot/compiler
`
  }
}
