/**
 * @see https://github.com/TooTallNate/ansi.js/tree/master/lib
 * @TODO optimize this
 */
module.exports = {
  reset() {
    // reference
    if (this.has('restoreColors') === true) {
      const restore = this.get('restoreColors')
      Object.keys(restore).forEach(color => {
        // console.log('restoring', {color, restore: restore[color].toString()})
        this[color] = restore[color]
      })
      this.delete('restoreColors')
    }
    if (this.has('cursor') === true) {
      this.get('cursor').reset()
      this.delete('cursor')
    }
    this.set('logger', console.log)
  },
  buffer() {
    return this.cursor().set('cursor', this.get('cursor').buffer())
  },
  indent(level = null, override = false) {
    const current = this.get('indent') || 0
    if (override === true) {
      return this.set('indent', level)
    }
    if (level === null) {
      return this.set('indent', current + 1)
    }
    if (level < 0) {
      return this.set('indent', current - level)
    }

    return this.set('indent', current + level)
  },
  flush() {
    // console.log('flushing')
    // @TODO safely check if it has \n
    this.cursor().get('cursor').write('\n').flush()
    return this
  },
  ansi(magicMode = true) {
    if (magicMode === true) {
      this.buffer().indent(1, true)
    }
    return this.cursor()
  },
  cursor(getCursor = false) {
    const has = this.has('cursor')
    if (getCursor === true && has === true) return this.get('cursor')
    else if (has === true) return this

    // @HACK @FIXME just here to allow echoing with conditionals in echo
    this.text('')

    // const {bold, red, blue, cyan, yellow, magenta, green, white} = this
    this.set('restoreColors', {
      bold: this.bold,
      red: this.red,
      blue: this.blue,
      cyan: this.cyan,
      yellow: this.yellow,
      magenta: this.magenta,
      green: this.green,
      white: this.white,
    })

    const add = name => (txt = null) => {
      const cursor = this.get('cursor')
      cursor[name]()

      // console.log('using color: ', name)
      // when we pass in text,
      // handle auto reset,
      // handle auto indent
      if (txt !== null) {
        this.write(txt)
      }
      return this
    }

    this.green = add('green')
    this.bold = add('bold')
    this.red = add('red')
    this.blue = add('blue')
    this.cyan = add('cyan')
    this.yellow = add('yellow')
    this.magenta = add('magenta')

    const ansi = this.requirePkg('ansi')
    const cursor = ansi(process.stdout)
    /* prettier-ignore */
    this
      .set('cursor', cursor)
      // .set('logger', (...args) => cursor.write(...args).write('\n'))
      .set('logger', (...args) => {
        this.get('cursor').write(...args)
        this.flush()
        // this.get('cursor').write('\n').reset()
      })

    if (getCursor === true) return this.get('cursor')
    return this
  },
  // like echo, but will not reset
  write(txt) {
    const cursor = this.get('cursor')
    const isStart = cursor._buffer && cursor._buffer.length === 0

    // don't mutate args
    let text = txt
    if (this.has('indent') === true && isStart === false) {
      text = ' '.repeat(this.get('indent')) + txt
    }
    // console.log({indent: this.get('indent'), isStart, text})

    cursor.write(text).reset()
    return this
  },
  rgb(rgb) {
    this.get('cursor').rgb(rgb)
    return this
  },
  hex(hex) {
    this.get('cursor').hex(hex)
    return this
  },
}
