module.exports = {
  reset() {
    this.delete('diffs')

    return this
  },

  /**
   * @desc
   *  take in 2 things to diff
   *  can pass in a diff1 and then call diff again to diff again
   *
   * @author https://github.com/challenger532 for this
   * @return {FlipLog} @chainable
   */
  diff() {
    const clone = this.requirePkg('lodash.clonedeep') // eslint-disable-line

    if (this.has('diffs') === false) {
      this.set('diffs', [])
    }

    const diffs = this.get('diffs')
    const args = Array.from(arguments).map(arg => clone(arg))

    this.set('diffs', diffs.concat(args))

    this.formatter(() => {
      const differ = this.requirePkg('diffs')
      const result = differ(...this.get('diffs'))

      // console.log('result?', result)
      if (this.has('text') === false) {
        this.bold('diff:\n\n')
      }

      return result
    })

    return this
  },

  /**
   * @depreciated @depricated v0.3.0
   * @see FlipLog.diff
   * @tutorial https://github.com/fliphub/fliplog/blob/master/README.md#%EF%B8%8F-diff
   * @return {string} table of diffs
   */
  diffs() {
    const differ = this.requirePkg('diffs')
    const result = differ(...this.get('diffs'))

    // console.log('result?', result)
    if (this.has('text') === false) {
      this.bold('diff:\n\n')
    }
    return this.data(result)
  },
}
