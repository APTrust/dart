module.exports = function capturePlugin({shh}) {
  return {

    /**
     * @tutorial https://gist.github.com/pguillory/729616#gistcomment-332391
     * @param  {any} data
     * @param  {any} fileDescriptor not implemented
     * @return {FlipLog} @chainable
     */
    saveLog(data, fileDescriptor) {
      this.fileDescriptor = fileDescriptor
      this.savedLog.push(data)
      return this
    },

    /**
     * @tutorial https://github.com/fliphub/fliplog#-silencing
     * @desc by-reference mutates object property to silence all
     * @return {FlipLog} @chainable
     */
    shush() {
      shh.shushed = true
      return this
    },

    /**
     * @see FlipLog.shush
     * @desc inverse of shush
     * @return {FlipLog} @chainable
     */
    unshush() {
      shh.shushed = false
      return this
    },

    /**
     * @desc captures all stdout content
     * @tutorial https://github.com/fliphub/fliplog#capture-all
     * @param  {Boolean} [output=false]
     * @return {FlipLog} @chainable
     */
    startCapturing(output = false) {
      const saveLog = this.saveLog.bind(this)
      this.stdoutWriteRef = process.stdout.write
      process.stdout.write = (function(write) {
        return function(string, encoding, fileDescriptor) {
          saveLog(string, fileDescriptor)
          // write.apply(process.stdout, arguments)
        }
      })(process.stdout.write)
      return this
    },

    /**
     * @desc restores original stdout
     * @see FlipLog.startCapturing
     * @return {FlipLog} @chainable
     */
    stopCapturing() {
      process.stdout.write = this.stdoutWriteRef
      return this
    },
  }
}
