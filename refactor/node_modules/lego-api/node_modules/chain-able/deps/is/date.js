const toS = require('./toS')

module.exports = obj => obj instanceof Date || toS(obj) === '[object Date]'
