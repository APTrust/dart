/**
 * @tutorial https://github.com/substack/camelize/blob/master/test/camel.js
 * @tutorial https://github.com/andrewplummer/Sugar/blob/9c018a257a38714b81f7df033b74d236dbf1e861/lib/string.js
 * @tutorial http://stackoverflow.com/questions/2970525/converting-any-string-into-camel-case
 * @tutorial https://github.com/sindresorhus/camelcase
 * @param  {string} str
 * @return {string}
 *
 * s.charAt(0).toLowerCase() + string.slice(1)
 */
module.exports = str =>
  str.replace(/\s+/g, '_').replace(/[_.-](\w|$)/g, (m, x) => x.toUpperCase())
