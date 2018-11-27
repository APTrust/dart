const isURL = require('validator/lib/isURL')
const isEmail = require('validator/lib/isEmail')
const isLength = require('validator/lib/isLength')
const isNumeric = require('validator/lib/isNumeric')
const trim = require('validator/lib/trim')
const isUUIDValidator = require('validator/lib/isUUID')
const validUrl = require('valid-url')

const isWebUri = validUrl.isWebUri
const minLength1 = value => isLength(trim(value), {min: 1})
const isPhone = value => isNumeric(value) && isLength(trim(value), {min: 6})
const alwaysTrueValidator = value => true
const isString = value => value && typeof value === 'string'
const isObj = value => value && typeof value === 'object'
/* prettier-ignore */
const isBool = value => value === true || value === false || typeof value === 'boolean'
/* prettier-ignore */
const isNotEmpty = value => typeof value !== 'undefined' && value !== undefined && value !== null
const isEmpty = value => !isNotEmpty(value)
const isUUID = value => isNotEmpty(value) && isUUIDValidator(value)

const isArray = Array.isArray

// isArray, isObj

module.exports = {
  alwaysTrueValidator,

  isBool,
  isNotEmpty,
  isEmpty,
  isObj,
  isArray,
  isString,
  isUUID,

  isURL,
  isEmail,
  isPhone,

  trim,
  minLength1,
  isLength,

  isWebUri,
  validUrl,
}
