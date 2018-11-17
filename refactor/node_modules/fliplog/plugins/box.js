module.exports = {
  deps: {
    boxen: '1.0.0',
  },

  reset() {
    this.boxStyles()
  },

  /**
   * @tutorial https://github.com/fliphub/fliplog#-box
   * @param  {any} styles
   * @return {FlipLog}
   */
  boxStyles(styles) {
    if (!styles) {
      styles = {
        padding: 1,
        margin: 1,
        borderStyle: 'double',
        default: true,
      }
    }

    return this.set('boxStyles', styles)
  },

  /**
   * @tutorial https://github.com/fliphub/fliplog#-box
   *
   * @see FlipLog.boxStyles
   * @param  {string | any}  input
   * @param  {object | any}  options
   * @param  {Boolean} [echo=false]
   * @return {FlipLog}
   */
  box(input, options, echo = false) {
    const boxen = this.requirePkg('boxen')
    if (boxen === false) {
      return this
    }

    const box = boxen(input, options || this.get('boxStyles'))

    if (options && options.default === true) {
      this.text(box)
    }
    else {
      this.data(box)
    }

    if (echo !== false) return this.echo()
    return this
  },
}
