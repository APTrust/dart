module.exports = function toArr(data, opts = null) {
  const defaults = {includeEmpty: false, keys: false, split: ','}
  if (opts) opts = Object.assign(defaults, opts)
  else opts = defaults
  const {includeEmpty, split, keys} = opts

  if (!data && !includeEmpty) return []
  if (Array.isArray(data)) return data

  if (typeof data === 'string') {
    if (typeof split === 'string' && data.includes(split)) {
      return data.split(split)
    }
    else if (Array.isArray(split)) {
      let splitData = []
      split.forEach(delimiter => {
        if (data.includes(delimiter)) {
          splitData = splitData.concat(data.split(delimiter))
        }
      })
      return splitData
    }
  }

  if (data && keys && typeof data === 'object') {
    return Object.keys(data)
  }
  else {
    return [data]
  }
}

module.exports.slice = Array.prototype.slice.call.bind(Array.prototype.slice)
