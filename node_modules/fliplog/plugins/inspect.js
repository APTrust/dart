const lib = require('../modules/inspector-gadget')

module.exports = {
  // pass in options for cleaner and use .from?
  // clean(data) {}
  inspectorGadget() {
    return lib
  },

  /**
   * @desc create a new cleaner, or return the lib
   * @see inspector-gadget/cleaner
   * @param {Object | boolean} [from=null] used to call methods on cleaner if needed, true returns as a lib
   * @return {Cleaner | FlipChain} has .echo bound to FlipChain
   */
  cleaner(from = null) {
    if (from === true) {
      const cleaner = new lib.cleaner(this)
      cleaner.end = () => this.data(cleaner.get('cleaned'))
      cleaner.echo = () => this.data(cleaner.get('cleaned')).echo()
      return cleaner
    }

    const cleaner = new lib.cleaner(this).data(this.get('data'))

    if (from !== null && typeof from === 'object') {
      if (from.keys) cleaner.keys(from.keys)
      if (from.vals) cleaner.vals(from.vals)
      if (from.onMatch) cleaner.onMatch(from.onMatch)
      if (from.data) cleaner.data(from.data)
    }

    cleaner.log = this
    cleaner.end = () => this.data(cleaner.get('cleaned'))
    cleaner.echo = () => this.data(cleaner.get('cleaned')).echo()

    return cleaner
  },
  inspector() {
    return lib.inspect
  },
  customInspect() {
    return lib.customInspect
  },
}
