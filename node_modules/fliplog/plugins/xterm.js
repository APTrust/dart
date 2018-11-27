module.exports = {
  // deps: {
  //   'cli-color': '1.2.0',
  // },

  /**
   * @tutorial https://github.com/fliphub/fliplog/blob/master/README.md#xterm
   * @see cli-color
   * @param  {number} color
   * @param  {number} [bgColor]
   * @return {FlipLog} @chainable
   */
  xterm(color, bgColor) {
    const clc = this.requirePkg('cli-color')

    if (!clc) return this

    if (typeof color === 'string' && color.includes('.')) {
      const colorArr = color.split('.')
      const txt = colorArr.shift()
      const bg = colorArr.pop()
      color = clc.xterm(txt).bgXterm(bg)
    }
    else if (color && bgColor) {
      color = clc.xterm(color).bgXterm(bgColor)
    }
    else if (Number.isInteger(color)) {
      color = clc.xterm(color)
    }
    else {
      color = clc.xterm(202).bgXterm(236)
    }

    return this.color(color)
  },
}
