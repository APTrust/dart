module.exports = map => {
  const entries = Array.from(map.entries())

  let reduced = {}
  if (entries.length !== 0) {
    reduced = entries.reduce((acc, [key, value]) => {
      acc[key] = value
      return acc
    }, {})
  }
  return reduced
}
