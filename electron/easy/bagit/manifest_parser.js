const { KeyValueCollection } = require('./key_value_collection');
const { PassThrough } = require('stream');

const spaces = /\s+/;
const newline = "\n";

class ManifestParser {
    constructor(bagItFile) {
        var parser = this;
        if (bagItFile.keyValueCollection == null) {
            bagItFile.keyValueCollection = new KeyValueCollection();
        }
        this.bagItFile = bagItFile;
        this.stream = new PassThrough();
        this.stream.setEncoding('utf8');
        this.lastFragment = '';
        parser.stream.on('data', function(data) {
            var lines = data.split(newline);
            var lastIndex = lines.length - 1;
            for (var i=0; i < lines.length; i++) {
                var line = lines[i];
                if (i == 0) {
                    // First chunk of new data may begin in the middle of a line.
                    line = parser.lastFragment + line;
                    parser.lastFragment = '';
                } else if (i == lastIndex && !data.endsWith(newline)) {
                    // Last chunk of data is an incomplete line fragment
                    parser.lastFragment = line;
                    continue;
                }
                // First item on line is the fixity value.
                // Second item is file name, which may contain multiple spaces.
                // PT #156706950: Preserve multiple consecutive spaces in file name
                if (i < lastIndex) {
                    var fixityValue = line.split(spaces, 1);
                    var filename = line.replace(fixityValue, '').trim();
                    //console.log(`"${filename}" = "${fixityValue}"`);
                    parser.bagItFile.keyValueCollection.add(filename, fixityValue);
                }
            }
        });
        parser.stream.on('end', function() {
            // Anything to do here?
            // Handle remaining lastFragment?
        });
    }
}

module.exports.ManifestParser = ManifestParser;
