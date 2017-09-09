'use strict'

const
  helpers = require('../helpers'),
  chalk = require('chalk'),
  path = require('path'),
  sh = require('shelljs'),
  constants = require('./../const'),
  TAG_TEMPLATE = constants.TAG_TEMPLATE,
  TAG_CREATED_CORRECTLY = constants.TAG_CREATED_CORRECTLY

/**
 * Create an empty tag template
 * @param   { Object } opt - cli options
 * @returns { Boolean } true if everything went fine
 */
module.exports = function(opt) {
  var tagName = path.basename(opt.new),
    out = helpers.toRelative(`${opt.new}.${opt.ext}`)

  sh.mkdir('-p', path.dirname(opt.new))

  sh
    .echo(TAG_TEMPLATE(tagName))
    .to(out)

  helpers.log(chalk.green(TAG_CREATED_CORRECTLY(out)))

  return true

}