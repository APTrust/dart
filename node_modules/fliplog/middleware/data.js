const {inspector} = require('../modules/inspector-gadget')
const {OFF} = require('../deps')

let prettyError = parseStackTrace => error => parseStackTrace.parse(error)

module.exports = {
  /**
   * @protected
   * @TODO should be formatters
   * @see FlipLog.tosource, FlipLog.highlight
   * @param  {any} msg
   * @return {string}
   */
  getToSource(msg) {
    const highlighter = this.get('highlighter')

    // typeof msg === 'object' &&
    if (this.has('tosource') === true) {
      const tosource = this.requirePkg('tosource')
      if (highlighter) return highlighter(tosource(msg))
      return tosource(msg)
    }

    if (highlighter) return highlighter(msg)

    return msg
  },

  // errorExtras(msg) {
  // console.log(this.requirePkg('error-stack-parser').parse())
  // const PrettyError = this.requirePkg('pretty-error')
  // if (!PrettyError) {
  //   return inspector(data, this.get('verbose'))
  // }
  //
  // const escapeReg = this.requirePkg('escape-string-regexp')
  // const pe = new PrettyError()
  // error = console.log(pe.render(msg))
  // const obj = Object.assign(new Error(msg.message), msg)
  // const obj = Object.create(Object.getPrototypeOf(msg))
  //   // custom props
  //   // const keys = Object.keys(msg)
  //   // if (keys.length) {
  //   //   const {datas} = this.factory()
  //   //     .data(
  //   //       keys.reduce((acc, key) => {
  //   //         acc[key] = msg[key]
  //   //         return acc
  //   //       }, {})
  //   //     )
  //   //     .returnVals()
  //   //
  //   //   try {
  //   //     const dataStr = datas + ''
  //   //     obj.data = dataStr
  //   //   }
  //   //   catch (e) {
  //   //     //
  //   //   }
  //   // }
  // const escaped = escapeReg(fileName)
  // const reg = new RegExp(
  //   '(\s*\()?' + escaped + '(\s*\:\d+\:\d+\))'
  // )
  // console.log(reg)
  // console.log(str)
  // console.log(str, source.match(reg))
  // .shift().trim()
  //
  //   // obj.stack = stack
  //
  //
  //   // const dataLogger = this.factory()
  //   // obj = dataLogger.data(obj).returnVals().datas
  //
  //   // console.log(Object.keys(msg))
  //   // console.log(stack)
  //   // delete obj.stack
  //   // try {
  //   //   const message = obj.message.split('\n')
  //   //   obj.message = message
  //   //   return obj
  //   // }
  //   // catch (e) {
  //   //   // do nothing, likely logging a trace
  //   // }
  // }

  prettifyError(msg) {
    const parser = prettyError(this.requirePkg('error-stack-parser'))
    const chalk = this.requirePkg('chalk')
    const strip = this.requirePkg('strip-ansi')

    let stack = msg.stack
    let obj = Object.create(null)

    // eslint-disable-next-line
    for (const prop in msg) {
      obj[prop] = msg[prop]
    }

    // use ansi?
    try {
      const stacked = parser(msg)
      let requireMain = require.main.filename
      let hitRequireMain = false
      let hitNativeNode = false
      let lastFile = false
      let lastSource = false
      stack =
        stacked
          .map(stackTrace => {
            const {fileName, functionName, source} = stackTrace
            const {lineNumber, columnNumber} = stackTrace
            const c = {
              fn: chalk.blue(functionName),
              col: columnNumber, // chalk.white(columnNumber),
              line: chalk.bold(lineNumber),
              file: chalk.underline(fileName),
              src: source,
            }

            // ------- same file
            if (lastFile === fileName) {
              c.file = ''
            }
            else {
              lastFile = fileName
            }

            // ----- same src
            if (lastSource + '' == source + '') {
              // c.src = ''
            }
            else {
              if (lastFile === fileName) {
                let str = source
                  // .split(fileName)
                  // .shift() // .split(' (,:')
                  // // .shift()
                  .trim()

                const lastParen = str.lastIndexOf(' (')
                if (lastParen > -1) {
                  str = str.slice(0, -1)
                }
                c.src = chalk.dim(str)
              }
              else {
                c.src =
                  '\n' +
                  chalk.dim(source.replace(fileName, chalk.underline(fileName)))
              }

              // const strippedSrc = strip(c.src + '').replace(/ /, '')
              // const strippedFile = strip(c.file + '').replace(/ /, '')
              // if (strippedSrc == strippedFile) {
              //   c.src = ''
              // }
              lastSource = '\n' + source + ''
            }

            // ----- don't want it not ours
            const moduleErrors = [
              'at Module._compile (module.js',
              'at Module.load (module.js',
              'at Object.Module._extensions..js (module.js',
            ]
            const isModuleError = moduleErrors
              .map(moduleError => source.includes(moduleError))
              .includes(true)

            if (isModuleError) {
              hitNativeNode = true
            }
            if (!hitRequireMain && fileName == requireMain) {
              hitRequireMain = true
              c.fn = chalk.bold(functionName)
              c.file = chalk.cyan(fileName)

              // puts on new line
              // const len = (this.get('text') || '').length || 1
              // c.col =
              //   c.col +
              //   ' ' +
              //   chalk.italic(
              //     '\n' + ' '.repeat(len) + ' require.main.filename ^ \n'
              //   )
              c.col = c.col + ' ' + chalk.magenta('(entry)')
              // c.src = c.src

              // // c.src = c.src
            }
            else if (hitRequireMain && hitNativeNode) {
              return false
            }
            else if (/undefined/.test(c.fn) && strip(c.src.trim()) == 'at') {
              // entry node file we don't want it
              return false
            }
            else if (/startup/.test(c.fn) && (/(at startup)/).test(c.src)) {
              // entry node file we don't want it
              return false
            }
            if (source.includes('fliplog') || source.includes('LogChain')) {
              return false
            }
            // in ${c.file}
            return `${c.fn} #${c.line}:${c.col} ${c.src}`
          })
          .filter(line => line)
          .join('\n') + '\n'

      delete obj.stack

      if (!Object.keys(obj).length) return stack

      let objStr = ''
      try {
        objStr = '\n' + this.prettyjson({extraErrorProperties: obj}) || ''
      }
      catch (e) {
        // ignore
      }

      stack += objStr || ''
      return stack
      // const logger = this.factory()
      // logger.from(this.entries())
      // obj.inspect = () => stack
      // const inspected = inspector(obj, this.get('verbose'))

      // @TODO:
      // this.tap('text', text => (text || '') + '\n')
      // return inspected
    }
    catch (errorOnError) {
      console.log({errorOnError, error: msg})
      return OFF
    }
  },

  /**
   * @TODO: special error cleaning prop to remove `node_modules` & `module`
   *
   * @protected
   * @see FlipLog.verbose, FlipLog.highlight
   * @param  {string | any} msg
   * @return {string | any}
   */
  getVerbose(msg) {
    if (msg === OFF) return msg
    let data = msg

    if (this.has('verbose') === true && typeof data !== 'string') {
      if (data && data.stack && data.message && data instanceof Error) {
        data = this.prettifyError(data)
        if (data !== OFF) return data
      }

      msg = inspector(msg, this.get('verbose'))
    }

    return msg
  },
}
