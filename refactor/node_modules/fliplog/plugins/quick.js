// ----------------------------- errors, catching, resetting ------------------
module.exports = {
  reset() {
    // so it can be called with
    // `.catch(log.catch)`
    this.catch = this.catch.bind(this)
  },

  /**
   * @tutorial https://github.com/fliphub/fliplog#use-built-ins
   * @param  {Error} error
   * @return {FlipLog}
   */
  error(error) {
    if (arguments.length === 1) {
      return this.preset('error').verbose(5).data(error).echo()
    }

    for (const arg of arguments) {
      this.preset('error').verbose(5).data(arg).echo()
    }

    return this
  },

  /**
   * just output some data quickly
   * @param  {any} data
   * @return {FlipLog}
   */
  just(data) {
    if (typeof data === 'string') this.text(data)
    else this.data(data)
    this.verbose(5)
    return this.echo()
  },

  /**
   * @tutorial https://github.com/fliphub/fliplog#-quick
   * @param  {any} arg
   * @return {FlipLog}
   */
  quick(arg) {
    this.reset()
    console.log('\n')
    this.color('yellow.bold')
      .text('=========== 💨  quick 💨  ===========')
      .space(1)
    if (arguments.length === 1) return this.data(arg).verbose().exit()
    return this.data(arguments).verbose().exit()
  },

  /**
   * @NOTE exits process
   * @param {Boolean} [log=true] false will not log that it exited
   */
  exit(log = true) {
    // this.trace()
    this.echo()
    this.reset()
    if (log) console.log('🛑  exit \n')
    process.exit()
  },

  /**
   * @param {Error} e
   * @param {*} arg2
   * @param {*} arg3
   * @tutorial https://github.com/fliphub/fliplog#-catch-errors
   * @see FlipLog.exit
   */
  catch(e, arg2 = null, arg3 = null) {
    if (arg2 === null) {
      this.error(e).exit(1)
    }
    else {
      this.error(arguments).exit(1)
    }
  },

  /**
   * @since 0.2.3
   * @param {Error} e
   * @tutorial https://github.com/fliphub/fliplog#-catch-errors
   * @see FlipLog.exit
   */
  catchAndThrow(e) {
    this.error(e).echo()
    throw e
  },
}
