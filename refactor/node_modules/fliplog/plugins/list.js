module.exports = {
  // deps: {
  //   listr: '0.11.0',
  // },
  // reset() {},
  addListItem(title, task, enabled, disabled) {
    if (this.has('list') === false) {
      this.set('list', [])
    }

    let item = {}

    // passing in an object
    if (typeof title === 'object' && typeof title !== 'function') {
      item = title
    }
    else {
      item = {title, task, enabled, disabled}
    }

    this.get('list').push(item)

    return this
  },
  startListr() {
    const Listr = this.requirePkg('listr')
    const list = new Listr()
    list.run()

    // this.set('listr', list)
    this.delete('list')
    return this
  },
  listr() {
    return this.requirePkg('listr')
  },
}
