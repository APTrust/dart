module.exports = function toArr(ar) {
  if (!ar) return []
  if (Array.isArray(ar)) return ar
  if (typeof ar === 'string') return ar.includes(',') ? ar.split(',') : [ar]
  if (ar instanceof Set || ar instanceof Map || ar.values) {
    const vals = []
    ar.values().forEach(v => vals.push(v))
    return vals
  }

  return [ar]
}

// module.exports.slice = Array.prototype.slice.call.bind(Array.prototype.slice)
