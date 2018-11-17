const {random, shuffle, chance} = require('../deps/fun')

module.exports = {
  // deps: {
  //   'sparkly': '3.1.2',
  // },
  sparkly(input = null, options = null) {
    const sparkly = this.requirePkg('sparkly')
    if (!sparkly) return this

    if (input === null) {
      // order from random
      input = [
        [0, 3, 5, 8, 4, 3, 4, 10],
        [1, 2, 3, 4, 5, 6, 7, 8],
        [1, 2, 3, 4, 5, 6, 7, 8],
        [1, 18, 9, 4, 10],
      ]
      input = shuffle(input).pop()
    }

    if (options === null && chance()) {
      options = {style: 'fire'}
    }

    return this.set('data', sparkly(input, options))
  },
}
