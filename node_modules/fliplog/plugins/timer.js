let fliptime

module.exports = {
  // deps: {
  //   'fliptime': '*',
  // },

  // ----------------------------- timer ------------------
  fliptime() {
    fliptime = fliptime || this.requirePkg('fliptime')
    return fliptime
  },
  startTimer(name) {
    this.fliptime().start(name)
    return this
  },
  stopTimer(name) {
    this.fliptime().stop(name)
    return this
  },
  lapTimer(name) {
    this.fliptime().lap(name)
    return this
  },
  echoTimer(name) {
    this.fliptime().log(name)
    return this
  },
  stopAndEchoTimer(name) {
    this.fliptime().stop(name).log(name)
    return this
  },
}
