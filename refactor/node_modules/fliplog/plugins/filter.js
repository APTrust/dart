let toarr
let shouldFilter

module.exports = {
  reset() {
    this.delete('tags')
  },

  /**
   * @TODO
   * - [ ] wildcard, best using [] instead
   * - [ ] use debugFor.js
   * - [ ] enableTags, disableTags
   * - [ ] handle keys here...
   *
   * @since 0.1.0
   * @tutorial https://github.com/fliphub/fliplog/blob/master/README.md#-filtering
   * @param {string | Array<string> | Function} filters filter white or black flags
   * @return {FlipLog} @chainable
   */
  filter(filters) {
    toarr = toarr ? toarr : require('chain-able/deps/to-arr')
    const filter = toarr(filters).concat(this.get('filters') || [])
    return this.set('filter', filter)
  },

  /**
   * @since 0.1.0
   * @desc tag the log for filtering when needed
   * @param {string | Array<string>} names tags to use
   * @return {FlipLog} @chainable
   */
  tags(names) {
    toarr = toarr ? toarr : require('chain-able/deps/to-arr')
    const tags = this.get('tags') || []
    const updated = tags.concat(toarr(names))
    return this.set('tags', updated)
  },

  /**
   * @protected
   * @since 0.1.0
   * @desc check if the filters allow the tags
   * @return {FlipLog} @chainable
   */
  _filter() {
    shouldFilter = shouldFilter ? shouldFilter : require('../deps/filter')

    const tags = this.get('tags') || []
    const filters = this.get('filter') || []
    const should = shouldFilter({filters, tags, instance: this})
    if (should) return this.silent(true)
    return this
    // console.log(tags, filters)
  },
}
