/*
  Jade HTML plugin.
  Part of the riot-compiler, license MIT

  History
  -------
  2016-03-09: Initital release
*/
var
  mixobj = require('./_utils').mixobj,
  parser = require('jade')

var defopts = {
  pretty: true,
  doctype: 'html'
}

/* eslint-disable */
console.log('DEPRECATION WARNING: jade was renamed "pug" - the jade parser will be removed in riot@3.0.0!')
/* eslint-enable */

module.exports = function _jade (html, opts, url) {

  opts = mixobj(defopts, { filename: url }, opts)

  return parser.render(html, opts)
}
