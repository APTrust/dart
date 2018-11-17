const toS = require('./toS')

module.exports = obj => obj instanceof Set || toS(obj) === '[object Set]'
