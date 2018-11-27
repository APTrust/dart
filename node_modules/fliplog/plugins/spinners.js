const {OFF} = require('../deps')

module.exports = {
  // ----------------------------- spinner ------------------
  // deps: {
  //   multispinner: '0.2.1',
  //   ora: '1.2.0',
  // },

  /**
   * @tutorial https://github.com/fliphub/fliplog/blob/master/README.md#ora
   * @see https://github.com/sindresorhus/log-update
   * @see https://github.com/sindresorhus/ora
   * @see https://github.com/sindresorhus/speed-test
   * @param  {Object} [options={}] ora options
   * @param  {String} [dots='dots1']
   * @return {Object} ora instance
   */
  ora(options = {}, dots = 'dots1') {
    const ora = this.requirePkg('ora')
    ora.fliplog = this

    if (typeof options === 'string') {
      options = {text: options}
    }
    if (this.get('color') && !options.color) {
      options.color = this.get('color')
    }

    this.Spinner = ora(options)

    this.spinners = this.spinners || {}
    this.spinners[
      options || options.text || Object.keys(this.spinners).length
    ] = this.Spinner

    return this.Spinner
  },

  /**
   * '<^>v', '|/-\\'
   * @see FlipLog.ora, FlipLog.startSpinners
   * @example `.spinner(message = 'flipping...', chars = )`
   * @see https://www.npmjs.com/package/cli-spinner#demo
   * @param  {String} [text='flipping...'] [description]
   * @param  {Object} [opts={}]            [description]
   * @return {Object} spinner
   */
  spinnerFactory(text = 'flipping...', opts = {}) {
    opts.text = text

    if (opts.ora) {
      delete opts.ora
      return this.ora(opts)
    }

    if (!opts.text.includes('%s')) opts.text = ' %s ' + text
    if (this.get('color') && !opts.color) {
      const colorFn = this.getLogWrapFn()
      opts.text = colorFn(opts.text)
    }

    const Spinner = require('../deps/Spinner')
    const spinner = new Spinner(opts)

    // to go back to chaining
    spinner.fliplog = () => this
    return spinner
  },

  /**
   * @tutorial https://github.com/fliphub/fliplog/blob/master/README.md#-multiple
   * @see https://github.com/werk85/node-html-to-text
   * @param  {Array<string> | any} [frames=OFF]
   * @return {FlipLog} @chainable
   */
  startSpinners(frames = OFF) {
    let opts = {}

    // if (log.spinnersStarted) return this

    this.spinnersStarted = true
    if (frames === OFF) {
      // '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'.split('')
      opts.frames = [
        '[   ]',
        '[.  ]',
        '[.. ]',
        '[ ..]',
        '[  .]',
        '[   ]',
        '[=  ]',
        '[== ]',
        '[ ==]',
        '[  =]',
        '[   ]',
        '[-  ]',
        '[-- ]',
        '[ --]',
        '[  -]',
        '[   ]',
        '[~  ]',
        '[~~ ]',
        '[ ~~]',
        '[  ~]',
        '[   ]',
        '[*  ]',
        '[** ]',
        '[ **]',
        '[  *]',
      ]
    }
    else if (Array.isArray(frames)) {
      opts.frames = frames
    }
    else if (typeof frames === 'object') {
      opts = frames
    }

    const Multispinner = this.requirePkg('multispinner')

    const spinners = {}
    Object.keys(this.spinnerOpts).forEach(key => {
      spinners[key] = this.spinnerOpts[key]
    })

    this.spinners = new Multispinner(spinners, opts)

    return this
  },

  /**
   * @see FlipLog.startSpinners
   * @return {FlipLog} @chainable
   */
  stopSpinners() {
    this.spinnersStarted = false
    this.spinners.success()
    return this
  },

  /**
   * @see FlipLog.startSpinners
   * @param {string} name
   * @param {string} [text='flipping...']
   * @param {Object} [opts={}]
   * @return {FlipLog} @chainable
   */
  addSpinner(name, text = 'flipping...', opts = {}) {
    opts.text = text

    this.spinners = this.spinners || {}
    this.spinnerOpts = this.spinnerOpts || {}
    this.spinnerOpts[name] = text

    return this
  },

  /**
   * @param  {String} [name='all'] spinner to remove, default remove all
   * @return {FlipLog} @chainable
   */
  removeSpinner(name = 'all') {
    // safety
    this.spinners = this.spinners || {success() {}}

    if (name === 'all') {
      // Object.values isn't on node 6.10 -.-
      return Object.keys(this.spinnerOpts)
        .map(key => this.spinnerOpts[key])
        .forEach(spinner => this.removeSpinner(spinner))
    }

    // key, value
    if (this.spinnerOpts[name]) name = this.spinnerOpts[name]

    try {
      this.spinners.success(name)
    }
    catch (e) {
      // ignore
    }

    return this
  },

  spinner(text = 'flipping...', opts = {}) {
    this.Spinner = this.spinnerFactory(text, opts)
    this.Spinner.start()
    return this
  },

  stopSpinner(clear = false) {
    if (clear) this.clear()
    if (!this.Spinner) return this
    this.Spinner.stop(clear)
    delete this.Spinner
    return this
  },
}
