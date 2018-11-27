
/**
 * @tutorial https://github.com/lukeed/obj-str
 * @param  {Object} obj
 * @return {string}
 */
function objToStr(obj) {
  let cls = ''
  for (const k in obj) {
    if (obj[k]) {
      cls && (cls += ' ')
      cls += k
    }
  }
  return cls
}


// https://github.com/npm/npmlog
// http://tostring.it/2014/06/23/advanced-logging-with-nodejs/
// http://www.100percentjs.com/best-way-debug-node-js/
// https://www.loggly.com/ultimate-guide/node-logging-basics/
// https://www.npmjs.com/package/cli-color
const clrs = [
  'black',
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
  'white',
  'gray',
  'red',
  'dim',
]
const bgColors = [
  'bgBlack',
  'bgRed',
  'bgGreen',
  'bgYellow',
  'bgBlue',
  'bgMagenta',
  'bgCyan',
  'bgWhite',
]
const em = ['italic', 'bold', 'underline']
const xtermByName = {
  colors: {
    orange: 202,
  },
  bg: {
    orange: 236,
  },
}
const psr3 = [
  'emergency',
  'alert',
  'critical',
  'error',
  'warning',
  'notice',
  'warning',
  'debug',
]

const combinations = clrs.concat(bgColors).concat(em)

// https://www.youtube.com/watch?v=SwSle66O5sU
const OFF = `${~315 >>> 3}@@`


module.exports = {
  combinations,
  OFF,
  bgColors,
  psr3,
  xtermByName,
  objToStr,
}
