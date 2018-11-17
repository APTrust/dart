module.exports = {
  // deps: {
  //   'beeper': '1.1.1',
  // },

  /**
   * @tutorial https://www.npmjs.com/package/beeper
   * @param  {Number}  [sequence=3] sequence to beep
   * @param  {Boolean} [echo=false] echo right away or not
   * @return {Object}
   */
  beep(sequence = 3, echo = false) {
    const beep = this.requirePkg('beeper') // eslint-disable-line

    const data = {
      inspect() {
        beep(sequence)
        return 'beeping! '
      },
    }

    if (echo !== false) {
      data.inspect()
      return this
    }

    return this.set('data', data)
  },
}
