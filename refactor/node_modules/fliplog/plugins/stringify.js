module.exports = {
  // deps: {
  //   'javascript-stringify': '1.6.0',
  // },

  jsStringify(data = null) {
    // const stringify = this.requirePkg('javascript-stringify')
    const stringify = require('../modules/javascript-stringify')
    if (data === null) return stringify

    const str = stringify(data)
    return str
  },

  /**
   * @tutorial https://github.com/fliphub/fliplog#-stringifying
   * @param  {any} data
   * @param  {any} [replacer=null]
   * @param  {String} [spacer='  ']
   * @param  {any} [options=null] javascript-stringify options
   * @return {FlipLog}
   */
  stringify(data, replacer = null, spacer = '  ', options = null) {
    const stringify = this.jsStringify()
    const prettified = stringify(data, replacer, spacer, options)
    return this.data(prettified)
  },
}
