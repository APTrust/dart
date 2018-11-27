//----------------------------------------------------------
// Setup
//----------------------------------------------------------
const name = 'node-multispinner'

//----------------------------------------------------------
// validOpts errs
//----------------------------------------------------------
/**
 * @func configurable
 * @desc Throws because opt is not a configurable prop.
 * @param {string} opt - opt that caused err
 * @throws Error
 */
function configurable(opt) {
  throw new Error(
    `${name}: ${opt} is not a configurable property`
  )
}

/**
 * @func optType
 * @desc Throws because opt is incorrect type.
 * @param {string} opt - opt that caused err
 * @param {string} type - name of type that opt should be
 * @throws Error
 */
function optType(opt, type) {
  throw new Error(
    `${name}: ${opt} option must have a value of type ${type}`
  )
}

/**
 * @func optsType
 * @desc Throws because opts is not an object.
 * @throws Error
 */
function optsType() {
  throw new Error(
    `${name}: opts param must be an object`
  )
}

function negative(opt) {
  throw new Error(
    `${name}: ${opt} must be greater than or equal to 0`
  )
}

//----------------------------------------------------------
// spinners errs
//----------------------------------------------------------
/**
 * @func spinnersType
 * @desc Throws because spinners is not an object or array.
 * @throws Error
 */
function spinnersType() {
  throw new Error(
    `${name}: spinners param is not an object or array`
  )
}

/**
 * @func spinnersEmpty
 * @desc Throws beacuse spinners is empty.
 * @throws Error
 */
function spinnersEmpty() {
  throw new Error(
    `${name}: object or array of spinners is empty`
  )
}

function unique(spinner) {
  throw new Error(
    `${name}: there are multiple spinners with ID '${spinner}'`
  )
}

//----------------------------------------------------------
// index errs
//----------------------------------------------------------
/**
 * @func invalidState
 * @desc Throws because state is not a valid.
 * @param {string} state - invalid state that was used
 * @throws Error
 */
function invalidState(state) {
  throw new Error(
    `${name}: ${state} is not a valid spinner state`
  )
}

//----------------------------------------------------------
// Export
//----------------------------------------------------------
module.exports = {
  validOpts: {
    configurable,
    optType,
    optsType,
    negative,
  },
  spinners: {
    spinnersType,
    spinnersEmpty,
    unique,
  },
  index: {
    invalidState,
  },
}
