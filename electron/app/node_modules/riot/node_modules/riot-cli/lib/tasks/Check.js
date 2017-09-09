'use strict'

const Task = require('../Task'),
  analyzer = require('../analyzer'),
  sh = require('shelljs'),
  helpers = require('../helpers'),
  chalk = require('chalk'),
  log = helpers.log,
  find = helpers.find,
  toRelative = helpers.toRelative


class Check extends Task {
  run(opt) {
    // check input files
    var from = opt.flow[0] == 'f' ? [opt.from] : find(this.extRegex, opt.from),
      // map the results of the tests
      results = from
        .map(file => {
          // get the content of the tag file analysing it
          var results = analyzer(sh.cat(file).toString().replace(/^\uFEFF/g, /* strips BOM */''))
          return {
            file: toRelative(file),
            errors: results.filter(result => result.error)
          }
        })
        // remove the entries without errors
        .filter(results => results.errors.length)

    // errors found
    if (results.length) {
      log(chalk.white.bgRed('Riot Tag Syntax Error'))
      // log the errors
      results.forEach(check => {
        check.errors.forEach(result => {
          log(chalk.yellow(`${result.line} | `) + result.source)
          log(chalk.red(`^^^  ${result.error}`))
        })
        log(chalk.yellow(`Total error: ${check.errors.length} in "${check.file}"`))
      })
    } else
      // congrats no errors found!
      log(chalk.green('No syntax error. Ready to compile :)'))

    return results

  }
}

module.exports = Check