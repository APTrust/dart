module.exports = {
  /**
   * @since 0.3.0, 0.2.0
   * @tutorial https://www.npmjs.com/package/expose-hidden
   * @param  {Boolean} [shouldExpose=true]
   * @return {FlipLog}
   */
  expose(shouldExpose = true) {
    const expose = this.requirePkg('expose-hidden')
    return this.formatter(expose)
  },
}
