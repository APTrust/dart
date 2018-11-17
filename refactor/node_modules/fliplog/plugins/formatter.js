module.exports = {
  reset() {
    this.delete('formatter')
    return this
  },

  /**
   * @tutorial https://github.com/fliphub/fliplog/blob/master/README.md#-formatter
   * @param  {Function} [cb] callback with data, returns formatted data
   * @return {FlipLog} @chainable
   */
  formatter(cb) {
    if (!cb)
      cb = arg => {
        if (arg && typeof arg === 'object') {
          Object.keys(arg).forEach(key => {
            if (typeof arg[key] === 'string') {
              arg[key] = arg[key].replace('', '')
            }
            else if (Array.isArray(arg[key])) {
              arg[key] = arg[key].map(a => cb(a))
            }
          })
        }
        return arg
      }

    // merge in formatters
    // if already array, append
    // otherwise, make an array
    if (this.has('formatter') === true) {
      const formatter = this.get('formatter')

      if (Array.isArray(formatter.fns)) {
        formatter.fns.push(cb)
        return this.set('formatter', formatter)
      }
      else {
        // go through them
        // if they return null, ignore it
        const formatterFn = arg => {
          const formatters = this.get('formatter').fns
          let data = arg
          formatters.forEach(fmtr => {
            data = fmtr(arg)
            if (data === null) data = arg
          })
          return data
        }
        formatterFn.fns = [cb]

        return this.set('formatter', formatterFn)
      }
    }
    else {
      this.set('formatter', cb)
    }

    return this
  },
}
