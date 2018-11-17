const toS = require('./toS')

module.exports = obj =>
  typeof obj === 'string' || toS(obj) === '[object String]'
