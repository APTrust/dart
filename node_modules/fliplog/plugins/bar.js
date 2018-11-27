const {random, shuffle, chance} = require('../deps/fun')

module.exports = {
  // deps: {
  //   'babar': '0.1.0',
  // },

  reset() {
    this.barStyles()
  },

  /**
   * @tutorial https://github.com/fliphub/fliplog#styles-and-bar
   * @param  {any} styles
   * @return {FlipLog}
   */
  barStyles(styles) {
    if (!styles) {
      styles = {
        color: 'green',
        width: 40,
        height: 10,
        maxY: 10,
        yFractions: 1,
      }
    }
    return this.set('barStyles', styles)
  },

  /**
   * @todo https://github.com/substack/node-charm
   * @todo https://www.npmjs.com/package/cli-chart
   *
   * @param  {any}  [input=null]
   * @param  {any}  styles
   * @param  {Boolean} [echo=false]
   * @return {FlipLog}
   */
  bar(input = null, styles, echo = false) {
    styles = styles || this.get('barStyles')
    if (input === null) {
      input = [
        [0, random(1, 10)],
        [1, random(0, 20)],
        [2, random(1, 5)],
        [3, random(0, 1)],
        [4, random(0, 15)],
      ]
    }
    const babar = this.requirePkg('babar')
    const data = babar(input, styles)
    return this.set('data', data)
  },
}
