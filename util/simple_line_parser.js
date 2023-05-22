const fs = require('fs')

/**
 * SimpleLineParser splits a text file into a number of lines
 * and returns the list of lines.
 */
class SimpleLineParser {

    /**
     * Creates a new SimpleLineParser.
     * 
     * @param {string} pathToFile - Path to the file you want to parse.
     */
    constructor(pathToFile) {
        this.pathToFile = pathToFile;
    }    

    /**
     * This reads the file and returns a list of lines. If omitEmpty
     * is true, this will return only non-empty lines. This is intended
     * to work on text files only.
     * 
     * Note that this method reads the entire file into memory at once,
     * and then splits it up. This is not intended to be used on large
     * (multi-megabyte) files.
     * 
     * This will throw an exception is file does not exist or if you
     * lack read permission.
     * 
     * @param {boolean} omitEmpty 
     * @returns {Array<string>}
     */
    getLines(omitEmpty) {
        let lines = []
        let contents = fs.readFileSync(this.pathToFile).toString().split("\n")
        contents.forEach(function (line) {
            let l = line.trim()
            if (!omitEmpty || l != '') {
                lines.push(l)
            }
        })
        return lines
    }
}

module.exports.SimpleLineParser = SimpleLineParser;
