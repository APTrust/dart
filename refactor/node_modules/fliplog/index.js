const ChainedMapExtendable = require('chain-able/ChainedMapExtendable')
const {OFF, objToStr} = require('./deps')
const pluginObjs = Object.assign(require('./plugins'), require('./middleware'))

const shh = {
  shushed: false,
}
let shushed = {}
let required = {}
let scoped = {}

/**
 *
 * @TODO:
 * - [x] change pkg config
 * - [x] be able to pass in .config at runtime to install more dependencies
 * - [x] check pkg json config at runtime
 * - [x] call depflip on postinstall
 * - [x] ensure all tests work
 * - test by installing in another package, release as alpha,
 *  - OR read its own pkg config hahah
 *
 * - ensure all files are in pkg.files
 * - update docs
 *
 * ------
 *
 * lower priority since it's a fair bit of work to mock this
 * unless it can be done with Reflection/Proxy??
 *
 * - [x] add safety to each function so check if dep is installed,
 *    if not, log that it was installed
 *    add to pkgjson config if it has one
 *    continue
 */

// const {compose} = require('chain-able')
// const ChainedMapExtendable = compose({extend: true})

class LogChain extends ChainedMapExtendable {
  /**
   * @param  {any} parent
   */
  constructor(parent) {
    super(parent)
    delete this.inspect
    this.version = '0.3.0'

    // this extending is 0microseconds
    this.extend(['title', 'color'])
    this.extendTrue(['space', 'tosource', 'time', 'silent'])

    this.set('logger', console.log)
    this.resets = []
    this.presets = {}
    this.log = this.echo
    this.shh = shh
    this.handleParent(parent)
    // this.clr = require('chalk')

    return this
  }

  /**
   * @inheritdoc
   * @see this.factory
   */
  static factory(instance = null) {
    return new LogChain(instance).factory(instance)
  }

  /**
   * @since 0.3.0
   * @TODO could be .scoped and then pass in debug here...
   * @desc creates a new instance
   * @param {FlipLog | null} [instance=null] specific instance, or new one
   * @return {FlipLog} @chainable
   */
  factory(instance = null) {
    const plugins = Object.keys(pluginObjs)
    const log = instance || new LogChain()

    for (let u = 0; u < plugins.length; u++) {
      const key = plugins[u]
      log.use(pluginObjs[key])
    }

    if (instance !== null && typeof instance === 'string') {
      scoped[instance] = log
    }

    return log.reset()
  }

  /**
   * @since 0.3.0
   * @desc adds to the scope, or gets from the scope :-}
   * @param  {string} name
   * @return {FlipLog} @chainable
   */
  scope(name) {
    scoped[name] = scoped[name] || this
    return scoped[name]
  }

  /**
   * @param  {string} name
   * @return {FlipLog}
   */
  used(name) {
    return this.set('used', (this.get('used') || []).concat([name]))
  }

  /**
   * @desc safely require a dependency if it exists
   *       if not, use the one in modules
   * @param  {string} name dependency package npm name
   * @return {false | Object | any} dependency required
   */
  requirePkg(name) {
    // if we've already included it - may need to set as require.resolve
    if (required[name]) {
      // return require(name) // eslint-disable-line
      return required[name] // eslint-disable-line
    }

    // wrap require
    const dep = require('./modules')(name)

    // warn and safely handle missing pkgs
    if (!dep) {
      // const colored = this.colored(name)
      // @nOTE: IGNORING THIS
      // this.text('did not have package ' + colored)
      //   .data(`npm i ${colored} --save-dev \n yarn add ${colored} --dev`)
      //   .echo()
      return false
    }

    // store result for later
    required[name] = dep

    // return dep
    return dep
  }

  /**
   * @TODO: should wait until done using, store the deps, do all at once, uniq them
   *
   * @param  {Object} obj
   * @return {FlipLog}
   */
  use(obj) {
    if (typeof obj === 'function' && Object.keys(obj).length === 0) {
      obj = obj(this)
    }

    if (this.deps === undefined) {
      this.deps = []
    }

    // @TODO:
    // this way we only use things once
    // and can debug what plugins/middleware/ was used
    if (this.has('used') === true) {
      if (obj.name && this.get('used').includes(obj.name)) {
        return this
      }
    }
    else if (obj.name !== undefined) {
      this.used(obj.name)
      delete obj.name
    }

    /**
     * so we can have a vanilla state with each plugin
     *
     * if it has a reset function,
     * add to an array of reset functions
     */
    if (obj.reset) {
      if (this.resets.includes(obj.reset) === false) {
        this.resets.push(obj.reset.bind(this))
      }
      delete obj.reset
    }

    /**
     * call any initialization decorators
     */
    if (obj.init) {
      obj.init.bind(this)()
    }

    const keys = Object.keys(obj)
    for (let k = 0; k < keys.length; k++) {
      const key = keys[k]
      if (key === 'deps' || typeof obj[key].bind !== 'function') {
        // console.log({key}, 'not bindable')
        continue
      }

      this[key] = obj[key].bind(this)
    }

    return this
  }

  /**
   * @private
   * @param {any} parent
   * @return {FlipLog}
   */
  handleParent(parent) {
    this.from = super.from.bind(this)
    if (!parent || !(parent instanceof ChainedMapExtendable)) return this

    const entries = parent.entries()
    if (!entries) return this

    const {filter} = entries
    const {presets} = parent

    if (presets) this.presets = presets
    if (filter) this.filter(filter)

    return this
  }

  /**
   * @TODO needs work to make it a function again
   * @param  {Boolean} [hardReset=false]
   * @return {FlipLog}
   */
  new(hardReset = false) {
    function LogChainFn(args = null) {
      if (args === null || args instanceof ChainedMapExtendable) {
        const log = new LogChain(args)
        return log.factory(log)
      }
    }
    return this

    // if using hard reset, do not inherit
    // const logChain = new LogChain(hardReset ? null : this)

    // return logChain

    // const expose = require('expose-hidden')

    // so we can extend without reassigning function name
    // delete logChain.name
    //
    // const logfn = (arg, text, color) => {
    //   return logChain.data(arg).text(text).color(color).verbose(10).echo()
    // }
    //
    // expose(logChain)
    // Object.assign(logfn, logChain)
    // return logfn
  }

  /**
   * @perf takes ~500 microseconds
   * reset the state so we do not instantiate every time
   * @return {FlipLog}
   */
  reset() {
    // if (this.resetted === true) return this
    // this.resetted = true
    if (!this.savedLog) this.savedLog = []
    // const timer = require('fliptime')
    // timer.start('reset')
    this.delete('silent')
      .delete('title')
      .delete('tosource')
      .delete('text')
      .delete('color')
      .delete('space')
      // .delete('data')
      .set('data', OFF)
      .verbose(10)

    // timer.start('fns')
    for (let r = 0; r < this.resets.length; r++) {
      this.resets[r]()
    }

    // timer.stop('reset').stop('fns').log('reset').log('fns')

    return this
  }

  // ----------------------------- adding data ------------------

  /**
   * @param  {number | boolean | string | any} data
   * @return {FlipLog}
   */
  verbose(data) {
    if (Number.isInteger(data)) {
      return this.set('verbose', data)
    }
    if (typeof data === 'boolean') {
      return this.set('verbose', data)
    }
    if (!data && data !== false) {
      return this.set('verbose', true)
    }
    if (data === false) {
      return this.set('verbose', false)
    }

    return this.set('data', data).set('verbose', true)
  }

  /**
   * @param {any} arg
   * @return {FlipLog}
   */
  data(arg) {
    if (arguments.length === 1) {
      return this.set('data', arg)
    }

    return this.set('data', Array.from(arguments))
  }

  /**
   * @param  {string | serializable} text
   * @return {FlipLog}
   */
  text(text) {
    if (this.has('title') === true) {
      const title = this.get('title') ? `${this.get('title')}` : ''
      return this.set('text', title + text)
    }

    return this.set('text', text)
  }

  /**
   * @tutorial https://github.com/fliphub/fliplog#-emoji
   * @see FlipLog.title
   * @param {string} name
   * @return {FlipLog}
   */
  emoji(name) {
    const emojiByName = require('./deps/emoji-by-name')
    return this.title(`${emojiByName(name)}  `)
  }

  /**
   * @param {string} msg
   * @param {string} [color=false]
   * @return {FlipLog}
   */
  addText(msg, color = false) {
    if (color !== false) {
      msg = this.getColored(color)(msg)
    }

    if (this.has('text') === true) {
      this.set('text', `${this.get('text')} ${msg}`)
    }
    else {
      this.text(msg)
    }

    return this
  }

  // ----------------------------- actual output ------------------

  /**
   * @since 0.3.0
   * @desc to reduce complexity in echo function
   * @return {FlipLog} @chainable
   */
  echoShushed() {
    // everything is silent everywhere,
    // store log with formatter,
    // reset
    this.finalize()
    const text = this.logText()
    const datas = this.logData()
    shushed[Date.now] = {text, datas}
    this.shushed = shushed
    this.reset()
    return this
  }

  /**
   * @see https://stackoverflow.com/questions/4976466/difference-between-process-stdout-write-and-console-log-in-node-js
   * @since 0.3.1
   * @desc set the logger to be process.stdout instead of console.log
   * @param  {boolean} [data=OFF] `false` will make it not output
   * @return {FlipLog} @chainable
   */
  stdout(data = OFF) {
    this.set('logger', process.stdout.write.bind(process.stdout))
    // this._stdout.write(require('util').format.apply(this, arguments) + '\n')
    return this.echo(data)
  }

  /**
   * @since 0.3.0
   * @see this.echo, this.finalize, this.logText, this.logData, this.reset
   * @desc the actual internal `console.log`ing
   * @return {FlipLog} @chainable
   */
  echoConsole() {
    // so we can have them on 1 line
    this.finalize()
    const text = this.logText()
    const datas = this.logData()
    const logger = this.get('logger') || console.log

    // check whether the values are default constant OFF
    // so that when we log, they can be on the same console.log call
    // in order to be on the same line
    if (datas === OFF && text === OFF) {
      return this
    }
    // text and no data
    if (datas !== OFF && text === OFF) {
      logger(datas)
    }
    else if (datas === OFF && text !== OFF) {
      // no data, just text
      logger(text + '')
    }
    else if (datas !== OFF && text !== OFF) {
      logger(text + '', datas)
    }

    if (this.has('spaces') === true) {
      const spaces = this.logSpaces()
      if (spaces !== '') logger(spaces)
    }

    // timer.stop('echo-new').log('echo-new')
    this.reset()
    return this
  }

  /**
   * @alias log
   * @since 0.0.1
   * @param  {boolean} [data=OFF] `false` will make it not output
   * @return {FlipLog} @chainable
   */
  echo(data = OFF) {
    // const timer = require('fliptime')
    // timer.start('echo-new')

    if (this.stack !== null && this.stack !== undefined) {
      this.stack()
    }

    if (this.has('tags') === true || this.has('filter') === true) {
      this._filter()
    }

    // don't call any formatter middleware, reset state, perf
    //  || data === 0
    if (data === false) {
      this.reset()
      return this
    }

    // data is default, use the stored data
    // if (data === OFF) {
    //   data = this.get('data')
    // }

    if (shh.shushed === true) {
      return this.echoShushed()
    }

    // don't call any formatter middleware, silent
    if (this.has('silent') === true) {
      this.reset()
      return this
    }

    // if we are using sleep plugin
    if (this.sleepIfNeeded !== undefined) {
      this.sleepIfNeeded()
    }

    return this.echoConsole()
  }

  /**
   * @private
   * @since 0.3.0
   * @desc call the formatters and transformers on the data if we are echoing
   *       so that they are only formatted when echoing
   * @return {FlipLog} @chainable
   */
  finalize() {
    let arg = this.get('data')
    if (this.has('formatter') === true) {
      arg = this.get('formatter')(arg)
    }
    return this.set('data', arg)
  }

  /**
   * @private
   * @since 0.1.0
   * @TODO: should call middleware instead of hardcoded methods
   * @desc does the actuall echoing of the text
   * @return {string}
   */
  logText() {
    if (this.has('text') === false) {
      return OFF
    }

    let text = this.get('text')

    // if (text === null || text === undefined || text === null || text === OFF) {
    // if (!text) return OFF

    // convert obj to string
    if (typeof text === 'object') {
      text = objToStr(text)
    }

    if (this.has('color') === true) {
      text = this.getColored(text)
    }
    if (this.has('text') === true) {
      text = this.getTime(text)
    }

    if (this.has('spaces') === true) {
      text += this.logSpaces()
    }

    return text
  }

  /**
   * @private
   * @TODO: should be array of middleware
   * @desc returns the data to log
   * @return {any}
   */
  logData() {
    let data = this.get('data')
    if (data === OFF) return OFF
    data = this.getToSource(data)
    data = this.getVerbose(data)

    return data
  }
}

// ----------------------------- instantiate ------------------

// instantiating + adding + reset = ~10 microseconds
const log = new LogChain().factory()

module.exports = log
