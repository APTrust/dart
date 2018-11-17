/**
 * @tutorial http://stackoverflow.com/questions/2970525/converting-any-string-into-camel-case
 * @tutorial https://github.com/sindresorhus/camelcase
 * @param  {string} str
 * @return {string}
 *
 * s.charAt(0).toLowerCase() + string.slice(1)
 */
function camelCase(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
      if (+match === 0) return '' // or if (/\s+/.test(match)) for white spaces

      // needs to be a loose 0 or first char will be uc if first char is -
      // eslint-disable-next-line
      return index == 0 ? match.toLowerCase() : match.toUpperCase()
    })
    .replace(/[-_]/g, '')
}

/**
 * @desc this duplicates keys, is simplest fastest
 * @NOTE mutates obj
 * @param  {Object} obj
 * @return {Object}
 */
function camelCaseKeys(obj) {
  const keys = Object.keys(obj)
  const camelKeys = keys.map(camelCase)
  for (let i = 0; i < keys.length; i++) {
    const camel = camelKeys[i]
    // console.log({camel, camelKeys, i, keys, c: camelKeys[i], k: keys[i]})
    if (camel.length === 0) continue
    obj[camel] = obj[keys[i]]
  }
  return obj
}

camelCase.keys = camelCaseKeys
camelCase.str = camelCase
module.exports = camelCase
