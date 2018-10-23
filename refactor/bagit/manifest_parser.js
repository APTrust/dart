const { Context } = require('../core/context');
const { KeyValueCollection } = require('./key_value_collection');
const { PassThrough } = require('stream');

const spaces = /\s+/;
const newline = "\n";

//
// TODO: JsDoc
//
class ManifestParser {
    constructor(bagItFile) {
        var parser = this;
        if (bagItFile.keyValueCollection == null) {
            bagItFile.keyValueCollection = new KeyValueCollection();
        }
        //
        // TODO: Document the following four properties.
        //
        this.bagItFile = bagItFile;
        this.stream = new PassThrough();
        this.stream.setEncoding('utf8');
        this.lastFragment = '';

        // Handle line, lines, or data fragments piped in from reader.
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
                if (i < lastIndex) {
                    var fixityValue = line.split(spaces, 1)[0];
                    var filename = line.replace(fixityValue, '').trim();
                    Context.logger.debug(`"${filename}" = "${fixityValue}"`);
                    parser.bagItFile.keyValueCollection.add(filename, fixityValue);
                }
            }
        });

        // Handle end of stream
        parser.stream.on('end', function() {
            Context.logger.debug(`Finished parsing manifest ${parser.bagItFile.absPath}`);
        });
    }
}

module.exports.ManifestParser = ManifestParser;
