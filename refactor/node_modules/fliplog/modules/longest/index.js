// https://github.com/jonschlinkert/longest/blob/master/index.js
// should not be a while loop
module.exports = function longest(arr) {
  if (!Array.isArray(arr)) {
    throw new TypeError('expected an array')
  }

  var len = arr.length
  if (len === 0) {
    return undefined
  }

  var val = arr[0]
  var longest = val.length
  var idx = 0

  while (++idx < len) {
    var ele = arr[idx]
    if (ele == null) {
      continue
    }

    var elen = ele.length
    if (typeof elen !== 'number') {
      continue
    }

    if (elen > longest) {
      longest = elen
      val = ele
    }
  }
  return val
}
