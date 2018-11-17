// https://github.com/chalk/ansi-regex/blob/master/index.js
const ansiRegex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-PRZcf-nqry=><]/g
const replaceAnsi = str => str.replace(ansiRegex, '')
replaceAnsi.ansiRegex = ansiRegex
replaceAnsi.stripAnsi = replaceAnsi
module.exports = replaceAnsi
