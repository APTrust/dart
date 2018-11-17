module.exports = {
  reset() {
    // console.log(this.entries())
    // console.log(this.get('time'))
    // persist the time logging
    if (this.get('time')) {
      this.time(true)
    }
    this.time(false)
  },
}
