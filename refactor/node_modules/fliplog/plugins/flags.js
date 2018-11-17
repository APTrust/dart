module.exports = {
  reset() {
    if (
      process.argv.includes('flipdebug=verbose') ||
      process.argv.includes('--flipdebug=verbose')
    ) {
      return this.set('filter', ['*'])
    }
    
    return this
  },
}
