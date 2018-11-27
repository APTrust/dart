const firstToUpper = str => str.charAt(0).toUpperCase() + str.slice(1)

const addPrefix = (string, prefix) => prefix + firstToUpper(string)

function removePrefix(string, prefix) {
  if (string.indexOf(prefix) === 0) string = string.slice(prefix.length)
  return string.charAt(0).toLowerCase() + string.slice(1)
}

module.exports = {
  firstToUpper,
  addPrefix,
  removePrefix,
}
