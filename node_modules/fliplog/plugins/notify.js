module.exports = {
  // deps: {
  //   'node-notifier': '5.1.2',
  // },

  /**
   * @tutorial https://github.com/fliphub/fliplog#-notify
   * @tutorial https://github.com/mikaelbr/node-notifier
   * @todo alias as notification/notify
   *
   * @param  {string | boolean | any}  options
   * @param  {any}  [msg=null]
   * @param  {Boolean} [echo=false]
   * @return {FlipLog}
   */
  notify(options, msg = null, echo = false) {
    const notifier = this.requirePkg('node-notifier') // eslint-disable-line

    if (
      typeof options === 'string' &&
      typeof msg === 'string' &&
      echo === true
    ) {
      notifier.notify({
        title: options,
        message: msg,
      })
    }
    else if (typeof options === 'string' && msg === true) {
      notifier.notify(options)
    }
    else if (echo === true) {
      notifier.notify(options)
    }
    else {
      return this.set('data', {
        inspect() {
          notifier.notify(options)
          return ''
        },
      })
    }

    return this
  },
}
