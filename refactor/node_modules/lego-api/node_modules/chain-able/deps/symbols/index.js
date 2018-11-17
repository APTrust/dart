// putting it here allows buble to ignore it
// const hasSymbol = typeof Symbol !== 'undefined'
// hasSymbol ? Symbol.iterator : 'Symbol(iterator)'

module.exports = {
  Iterator: Symbol.iterator,
  Primative: Symbol.toPrimitive,
  Instance: Symbol.hasInstance,
  Spreadable: Symbol.isConcatSpreadable,
  Species: Symbol.species,
}
