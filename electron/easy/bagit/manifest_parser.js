const { KeyValueCollection } = require('./key_value_collection');
const { Readable } = require('stream');

const spaces = /\s+/;
const newline = "\n";

class ManifestParser {
    constructor(bagItFile) {
        if (bagItFile.keyValueCollection == null) {
            bagItFile.keyValueCollection = new KeyValueCollection();
        }
        this.readableStream = new Readable();
        this.readableStream.setEncoding('utf8');
        this.bagItFile = bagItFile;
        this.lastFragment = '';
        this.readableStream.on('data', function(data) {
            var lines = data.split(newline);
            var lastIndex = lines.length - 1;
            for (var i=0; i < lines.length; i++) {
                var line = lines[i];
                if (i == 0) {
                    // First chunk of new data may begin in the middle of a line.
                    line = this.lastFragment + line;
                    this.lastFragment = '';
                } else if (i == lastIndex && !data.endsWith(newline)) {
                    // Last chunk of data is an incomplete line fragment
                    this.lastFragment = line;
                    continue;
                }
                var parts = line.split(spaces);
                if (i < lastIndex) {
                    var key = parts[1].trim();   // file name
                    var value = parts[0].trim(); // fixity value
                    this.bagItFile.keyValueCollection.add(key, value);
                }
            }
        });
        this.readableStream.on('end', function() {
            // Anything to do here?
        });
    }
}
