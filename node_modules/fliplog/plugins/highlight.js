module.exports = {
  // deps: {
  //   'cli-highlight': '^1.1.4',
  // },

  reset() {
    this.delete('highlighter')
  },

  /**
   * @tutorial https://github.com/fliphub/fliplog#-highlight
   * @TODO: should add as a middleware to highlight when called
   *
   * @param  {string | any} [code=null]
   * @param  {String} [language='javascript']
   * @return {FlipLog}
   */
  highlight(code = null, language = 'javascript') {
    const clihighlight = this.requirePkg('cli-highlight')

    if (clihighlight === false) return this

    const {highlight} = clihighlight
    const opts = {language, ignoreIllegals: false}

    return this.set('highlighter', data => {
      const tagged = highlight(data || this.get('data'), opts)
      return tagged.replace(/<\/?[^>]+(>|$)/g, '') + '\n'
    })
  },
}
