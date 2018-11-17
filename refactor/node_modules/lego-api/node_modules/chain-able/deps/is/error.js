const toS = require('./toS')

module.exports = obj => obj instanceof Error || toS(obj) === '[object Error]'
