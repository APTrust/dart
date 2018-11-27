const signalExit = require('../signal-exit')
const onetime = require('../onetime')

module.exports = onetime(() => {
  signalExit(
    () => {
      process.stderr.write('\u001b[?25h')
    },
    {alwaysLast: true}
  )
})
