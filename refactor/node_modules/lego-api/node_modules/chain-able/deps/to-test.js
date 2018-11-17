const esc = require('./escape-string-regex')

module.exports = (key, arg1, arg2) => {
  const type = typeof key
  // log
  //   .dim('testing keys')
  //   .data({test, arg1, matched: test.test(arg1)})
  //   .echo(debug)
  if (type === 'string') {
    const test = new RegExp(esc(key))
    return !!test.test(arg1)
  }
  if (type === 'function' && !key.test) return !!key(arg1)
  return !!key.test(arg1, arg2)
}
