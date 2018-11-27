const {ChainedMap, ChainedSet} = require('chain-able')
const Conditional = require('./Conditional')

/**
 * @classdesc build on demand
 *            set conditionals, an object with keys to enable
 *            .start condition names, make into conditionals
 *            .add lines of code
 *            .end conditions
 */
class LegoAPI extends ChainedMap {
  // protected

  // --- construct/setup ---

  static init(conditions) {
    return new LegoAPI().conditions(conditions)
  }
  static parse(contents) {
    return LegoAPI.init().parse(contents)
  }

  constructor(parent) {
    super(parent)

    // setup the children, just tell them the className for debugging
    this.result = ``
    this.conditionals = new ChainedSet(this.className)

    // defaults, configurable
    this.debug(false).startRegex().endRegex().splitRegex()
  }

  // --- configurable --- (needs docs)

  log(text) {
    if (this.get('debug')) {
      console.log(text)
    }
    return this
  }
  debug(should = true) {
    return this.set('debug', should)
  }
  startRegex(startRegex = /^\s*\/\*\s*@if\s(.*?)\s*\*\//) {
    return this.set('startRegex', startRegex)
  }
  endRegex(endRegex = /^\s*\/\*\s*@end\s*\*\//) {
    return this.set('endRegex', endRegex)
  }
  splitRegex(splitRegex = /\r?\n/) {
    return this.set('splitRegex', splitRegex)
  }

  // --- data --- (needs docs)

  conditions(conditions) {
    return this.set('conditions', conditions)
  }
  parse(contents) {
    return this.set('contents', contents)
  }

  /**
     * @example `$eh$!`.interpolate({eh: 'groovy'}) -> 'grovy!'
     * @param {Object} variables to interpolate with
     * @return {LegoAPI} @chainable
     */
  interpolate(variables) {
    Object.keys(variables).forEach(varName => {
      const arg = JSON.stringify(variables[varName])
      this.result = this.result.replace(`$${varName}$`, arg)
    })
    return this
  }

  // --- handle ---

  render(conditions) {
    const lego = this.conditions(conditions)
    const {startRegex, endRegex, splitRegex} = this.entries()

    this.log({startRegex, endRegex, splitRegex})

    return lego
      .get('contents')
      .split(splitRegex)
      .map(line => {
        const startIf = line.match(startRegex)
        const endIf = line.match(endRegex)
        if (!startIf && !endIf) return lego.add(line)
        if (startIf) return lego.start(startIf[1])
        if (endIf) return lego.end()
      })
      .pop()
      .toString()
  }

  // --- operations ---

  /**
     * @desc when we have a current conditional, append the new name
     *       otherwise, use the provided conditional
     *       @modifies this.current
     *       @modifies this.conditionals
     * @see Conditional.isEnabled&.name
     * @param  {string} name
     * @return {LegoAPI} @chainable
     */
  start(name) {
    let namespace = name
    if (this.current) {
      namespace = this.current.get('name') + '.' + name
    }

    this.log('starting condition: ' + namespace)
    const condition = new Conditional(this.current || this)
    condition.name(namespace)

    this.current = condition
    this.conditionals.add(condition)

    return this
  }

  /**
     * @desc calls .end on this.current,
     *       when it has a parent, go back up,
     *       otherwise, null
     *       @modifies this.current
     * @param  {string} name
     * @return {LegoAPI} @chainable
     */
  end(name) {
    if (this.current && this.current.end)
      this.current = this.current.end() || this

    if (this.current === this) this.current = false

    this.log('ending current condition')

    return this
  }

  /**
     * @desc when there is a conditional... check it
     *       when no conditional...
     *       Unconditional Love...
     *       is a condition outside of all conditions
     *
     * @param  {string} line
     * @return {LegoAPI} @chainable
     */
  add(line) {
    if (this.current) {
      if (this.current.isEnabled()) {
        this.log('line is enabled, adding: ' + line)
        this.result += line + '\n'
      }
      else {
        this.log('line is not enabled: ' + line)
      }
    }
    else {
      this.log('adding line, no current: ' + line)
      this.result += line + '\n'
    }

    return this
  }

  toString() {
    return this.result
      .split('\n')
      .filter(line => !['\n', '\r', ''].includes(line.trim()))
      .join('\n')
      .replace(/(\n|\r{2})+/gm, '\n')
  }
}

LegoAPI.LegoAPI = LegoAPI
module.exports = LegoAPI
module.exports.default = module.exports
Object.defineProperty(module.exports, '__esModule', {value: true})
