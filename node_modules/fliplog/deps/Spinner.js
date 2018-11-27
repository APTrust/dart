// const {Spinner} = require('cli-spinner')
const readline = require('readline')

module.exports = class Spinner {
  constructor(options) {
    this.text = ''
    this.title = ''
    this.chars = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
    this.stream = process.stdout
    this.delay = 60
    if (typeof options === 'string') {
      options = {text: options}
    }
    else if (!options) {
      options = {}
    }

    if (options.chars) this.chars = options.chars
    if (options.text) this.text = options.text
    if (options.onTick) this.onTick = options.onTick
    if (options.stream) this.stream = options.stream
    if (options.title) this.title = options.title
    if (options.delay) this.delay = options.delay
  }

  start() {
    let current = 0
    this.id = setInterval(() => {
      let msg = this.chars[current] + ' ' + this.text
      if (this.text.includes('%s')) {
        msg = this.text.replace('%s', this.chars[current])
      }

      this.onTick(msg)
      current = ++current % this.chars.length
    }, this.delay)
  }

  stop(clear) {
    clearInterval(this.id)
    this.id = undefined
    if (clear) {
      this.clearLine(this.stream)
    }
  }

  isSpinning() {
    return this.id !== undefined
  }

  onTick(msg) {
    this.clearLine(this.stream)
    this.stream.write(msg)
    return this
  }

  clearLine(stream) {
    readline.clearLine(stream, 0)
    readline.cursorTo(stream, 0)
  }
}
