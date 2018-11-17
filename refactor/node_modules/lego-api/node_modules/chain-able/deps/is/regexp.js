const toS = require('./toS')

module.exports = obj => obj instanceof RegExp || toS(obj) === '[object RegExp]'
