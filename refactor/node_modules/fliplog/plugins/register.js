module.exports = {
  registerConsole() {
    console.verbose = (text, ...data) => this.verbose().data(...data).echo()
    console.info = (text, ...data) =>
      this.emoji('info').verbose().data(...data).echo()
    console.error = (text, e) => this.preset('error').error(e).echo()
    console.track = () => this.trackConsole().echo()
    console.trace = () => this.trace().echo()
    console.note = (text, ...data) =>
      this.preset('note').text(text).data(...data).echo()
    console.warning = (text, ...data) =>
      this.preset('warning').text(text).data(...data).echo()
    console.spinner = (text, ...options) => this.spinner(text, ...options)

    console.time = name => this.timer.start(name).echo()
    console.timeLap = name => this.timer.lap(name)
    console.timeLapEcho = name => this.timer.lap(name).echo()
    console.timeEnd = name => this.fliptime().end(name).log(name)

    console.bold = (text, data = OFF) => this.bold(text).data(data).echo()
    console.red = (text, data = OFF) => this.red(text).data(data).echo()
    console.yellow = (text, data = OFF) => this.yellow(text).data(data).echo()
    console.cyan = (text, data = OFF) => this.cyan(text).data(data).echo()
    console.underline = (text, data = OFF) =>
      this.underline(text).data(data).echo()
    console.magenta = (text, data = OFF) => this.magenta(text).data(data).echo()

    console.box = (...options) => this.box(...options).echo()
    console.beep = (...options) => this.beep(...options).echo()
    console.timer = (...options) => this.timer()
    console.table = (...options) => this.table(...options).echo()
    console.diff = (...options) => this.diff(...options)
    console.diffs = () => this.diffs().echo()
    console.stringify = (...data) => this.stringify(...data).echo()
    console.stack = (...data) => this.stack(...data).echo()
    console.json = (...data) => this.json(...data).echo()
    console.filter = (...data) => this.filter(...data).echo()
    console.tags = (...data) => this.tags(...data).echo()
    console.quick = (...data) => this.quick(...data).echo()
    console.exit = (...data) => this.exit(...data).echo()
    console.reset = (...data) => this.reset(...data).echo()
    console.sleep = (...data) => this.sleep(...data).echo()
    console.slow = (...data) => this.slow(...data).echo()

    return this
  },

  // https://gist.github.com/benjamingr/0237932cee84712951a2
  registerCatch() {
    process.on('unhandledRejection', (reason, p) => {
      console.log('Possibly Unhandled Rejection at: Promise ', p, ' reason: ', reason)
      // this.red(p).echo()
      // this.error(reason).echo()
      process.exit(1)
      // this.catchAndThrow(reason, p)
    })
    process.on('unhandledException', exception => {
      console.log('fliplog catching unhandledException')
      this.error(exception).echo()
      process.exit(1)
      // this.catchAndThrow(exception)
    })
  },
}
