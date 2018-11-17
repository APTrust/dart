const toS = require('./toS')

module.exports = obj => toS(obj) === '[object Symbol]'
