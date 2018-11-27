const toS = require('./toS')

// Object.prototype.toString.call(val) === '[object Object]' &&
module.exports = val => toS(val) && Object.keys(val).length === 0
