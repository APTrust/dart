module.exports = {
  // deps: {
  //   progress: '1.1.8',
  // },

  /**
   * @tutorial https://github.com/fliphub/fliplog#-progress
   *
   * @TODO:
   * - [ ] do not echo right away
   * - [ ] https://www.npmjs.com/package/node-progress-bars
   *
   * @param  {Number} [total=20]
   * @param  {any} [cb=null]
   * @param  {Number} [interval=100]
   * @return {FlipLog} @chainable
   */
  progress(total = 20, cb = null, interval = 100) {
    if (!process.stdout.isTTY) return this
    const ProgressBar = this.requirePkg('progress')

    if (typeof total === 'string' && typeof cb === 'object') {
      this.progressBar = new ProgressBar(total, cb)
      if (typeof interval === 'function') {
        interval(this.progressBar)
      }
      return this
    }

    if (cb === null) {
      cb = bar => {
        bar.tick()
        if (bar.complete) clearInterval(this.progressCb)
      }
    }

    this.progressBar = new ProgressBar('  ╢:bar╟', {
      // complete: green,
      // incomplete: red,
      total,
      complete: '█',
      incomplete: '░',
      clear: true,

      // terminal columns - package name length - additional characters length
      width: (process.stdout.columns || 100) - 50 - 3,
    })

    if (interval) {
      const cbcb = () => cb(this.progressBar, this.progressCb)
      this.progressCb = setInterval(cbcb, interval)
    }
    else {
      this.progressCb = cb(this.progressBar)
    }

    // this.progress = new Progress().init(100)
    return this
  },
}
