module.exports = {
  // ----------------------------- file ------------------
  // https://gist.github.com/rtgibbons/7354879

  // using always will make every log go to the file
  // otherwise it is reset
  toFile(filename, always = false) {
    this.set('file', filename)
    return this
  },

  writeToFile(contents) {
    const write = require('flipfile/write')
    write(filename, contents)
    return this
  },
}
