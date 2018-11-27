module.exports = {
  prettyformat(obj) {
    const format = this.requirePkg('pretty-format')
    return this.formatter(format).data(obj)
  },
  fmtobj(obj) {
    const format = this.requirePkg('fmt-obj')
    return this.formatter(format).data(obj)
  },
  prettysize(bytes) {
    const pretty = this.module('prettysize')(bytes)
    return this.text(pretty)
  },
  module(name) {
    return this.requirePkg(name)
  },
  tree(obj) {
    const format = this.requirePkg('treeify')
    return this.formatter(data => format.asTree(data, true)).data(obj)
  },
}
