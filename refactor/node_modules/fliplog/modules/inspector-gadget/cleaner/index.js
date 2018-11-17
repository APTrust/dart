const ChainedMap = require('chain-able/ChainedMapExtendable')
const traverse = require('./traverse')
// const log = require('fliplog')

let clone

class Cleaner extends ChainedMap {
  /**
   * @param  {Cleaner | Chainable | null} [parent=null]
   */
  constructor(parent = null) {
    super(parent)
    this.data = this.obj.bind(this)
    this.clean = this.clean.bind(this)
  }

  /**
   * @param  {Object | null} [obj=null]
   * @return {Cleaner} @chainable
   */
  static init(obj = null) {
    if (obj === null) {
      return new Cleaner()
    }
    return new Cleaner().obj(obj).onMatch()
  }

  /**
   * @alias data
   * @param  {Object | null} [obj=null]
   * @return {Cleaner} @chainable
   */
  obj(obj = null) {
    if (!obj) return this
    return this.set('obj', obj)
  }

  /**
   * @desc clone the object - lodash.cloneDeep can infinitely loop so need a better one
   * @since fliplog:v0.3.0-beta6
   * @param  {Object | any} [obj=null]
   * @return {Cleaner} @chainable
   */
  clone(obj = null) {
    clone = clone || require('../../')('lodash.clonedeep')
    return this.set('obj', clone(obj))
  }

  /**
   * @desc matches for value
   *       @modifies this.vals
   * @param  {Array<Regexp | Function>} tests
   * @return {Cleaner} @chainable
   */
  keys(tests) {
    return this.set('keys', tests)
  }

  /**
   * @desc matches for value
   *       @modifies this.vals
   * @param  {Array<Regexp | Function>} tests
   * @return {Cleaner} @chainable
   */
  vals(tests) {
    return this.set('vals', tests)
  }

  /**
   * @desc callback for each match
   *       @modifies this.onMatch
   * @param  {Function} [cb=null] defaults to .remove
   * @return {Matcher} @chainable
   */
  onMatch(cb = null) {
    if (cb === null) {
      return this.set('onMatch', (arg, traverser) => {
        traverser.remove()
      })
    }

    return this.set('onMatch', cb)
  }

  /**
   * @desc runs traverser, checks the tests, calls the onMatch
   *       @modifies this.cleaned
   * @return {any} this.obj/data cleaned
   */
  clean() {
    if (this.has('onMatch') === false) this.onMatch()
    const debug = this.get('debug')
    const {obj, keys, vals, onMatch} = this.entries()
    // console.log('starting match...')
    // log.bold('key val matchers').fmtobj({keys, vals}).echo(debug)

    // debug this
    const matcher = (prop, val) => {
      if (keys) {
        for (var keyTest of keys) {
          // log
          //   .dim('testing keys')
          //   .data({test, prop, matched: test.test(prop)})
          //   .echo(debug)
          if (typeof keyTest === 'function' && !keyTest.test && keyTest(prop)) {
            return true
          }
          else if (keyTest.test(prop)) {
            // log.green('matched!').echo(debug)
            return true
          }
        }
      }

      if (vals) {
        for (var valTest of vals) {
          // log
          //   .dim('testing vals')
          //   .data({test, val, matched: test.test(val)})
          //   .echo(debug)
          if (typeof valTest === 'function' && !valTest.test && valTest(prop)) {
            return true
          }
          else if (valTest.test(val)) {
            // log.green('matched!').echo(debug)
            return true
          }
        }
      }

      // log.red('did not match').fmtobj({prop, val}).echo(debug)
      return false
    }

    // bound to the traverser
    traverse(obj).forEach(function(x) {
      // require('fliplog').data({ x }).bold(this.key).echo()
      // if (x && x.parser) this.remove()
      if (matcher(this.key, x)) {
        // require('fliplog').data({ x }).bold(this.key).echo()
        onMatch(x, this)
      }
      else {
        // require('fliplog').data({ x }).red(this.key).echo()
      }
    })

    this.set('cleaned', obj)
    return this
  }

  cleaned() {
    return this.get('cleaned')
  }
}

module.exports = Cleaner
