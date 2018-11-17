const toS = require('./toS')

module.exports = obj => obj instanceof Map || toS(obj) === '[object Map]'
