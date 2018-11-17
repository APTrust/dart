module.exports = {
  /**
   * @tutorial https://github.com/fliphub/fliplog#-clear
   * @see cli-color
   * @see https://github.com/medikoo/cli-color/blob/master/reset.js
   * @return {FlipLog} @chainable
   */
  clear() {
    process.stdout.write('\x1b[2J\x1b[0;0H')
    return this
  },
}
