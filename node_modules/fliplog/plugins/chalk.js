module.exports = {
  /**
   * @since 0.0.1
   * @see chalk
   * @param  {string} color
   * @return {FlipLog}
   */
  color(color) {
    let clr = color

    if (this.has('color') === true) {
      clr = this.get('color') + '.' + color
    }

    return this.set('color', clr)
  },

  /**
   * @since 0.2.2
   * @desc pass in text, return it colored
   * @param {string} msg
   * @param {string} [color=null]
   * @return {string} highlighted
   */
  colored(msg, color = null) {
    if (color !== null) this.color(color)
    const colored = this.text(msg).logText()
    this.reset()
    return colored
  },

  /**
   * @since 0.2.1
   * @see chalk
   * @return {Object} chalk
   */
  chalk() {
    return this.requirePkg('chalk')
  },
}
