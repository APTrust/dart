const isPureObj = require('./pureObj')

module.exports = x => isPureObj(x) || typeof x === 'function'
