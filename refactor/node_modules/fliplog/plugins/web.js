/**
 * @TODO
 *  - [ ] table (compat with node one)
 *  - [ ] group
 *  - [ ] warn, dir, error, log, debug
 * @type {Object}
 */
module.exports = {
  fontWeight(weight = 'bold') {
    return this.set('fontweight', weight)
  },
  fontSize(size = 'x-large') {
    return this.set('fontsize', size)
  },
  color(color, bgColor = null) {
    return this.set('color', color).set('bgColor', bgColor)
  },
  dir() {
    return this.set('log', console.dir)
  },
  table() {
    return this.set('log', console.table)
  },

  /**
   * @TODO improve the returning function
   * @example console.log('%cLogChain', 'color: blue; font-size: x-large')
   * @see http://stackoverflow.com/questions/7505623/colors-in-javascript-console
   * @see https://developers.google.com/web/tools/chrome-devtools/console/console-write#styling_console_output_with_css
   * @return {Function} a function prototype bound to console to output in the correct location, needs work
   */
  echo() {
    if (!this.parent || (this.parent && this.parent.get('debug') === true)) {
      let {data, text, color, fontsize, fontweight} = this.entries()
      let log = this.get('log') || console.log

      let fmt = ''
      if (color) fmt += 'color: ' + color + ';'
      if (fontweight) fmt += 'font-weight: ' + fontweight + ';'
      if (fontsize) fmt += 'font-size: ' + fontsize + ';'

      const args = [text, fmt, data]

      return Function.prototype.apply.bind(log, console, args)
    }

    // or noop if disabled
    return function noop() {} // eslint-disable-line
  },

  data(data) {
    return this.set('data', data)
  },

  text(string) {
    return this.set('text', '%c' + string)
  },
}
