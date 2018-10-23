const { Context } = require('../core/context');
const { KeyValueCollection } = require('./key_value_collection');
const { PassThrough } = require('stream');

const leadingSpaces = /^\s+/;
const newline = "\n";
const tagStart = /^\w+/;

class TagFileParser {
    constructor(bagItFile) {
        var parser = this;
        if (bagItFile.keyValueCollection == null) {
            bagItFile.keyValueCollection = new KeyValueCollection();
        }
        this.bagItFile = bagItFile;
        this.stream = new PassThrough();
        this.stream.setEncoding('utf8');
        this.content = '';
        parser.stream.on('data', function(data) {
            // Probably OK to read tag files into string, because
            // they're usually just a few KB, and the bagit spec's
            // tag value line continuations would make a stream hard
            // to parse.
            parser.content += data;
        });
        parser.stream.on('end', function() {
            // Parse the accumulated data into key-value pairs.
            var tag = '';
            var value = '';
            for (var line of parser.content.split(newline)) {
                var cleanLine = line.trim();
                if (cleanLine.length == 0) {
                    continue;
                }
                if (tag && line.match(leadingSpaces)) {
                    // This line is a continuation of a value that
                    // started on the previous line.
                    value += ` ${cleanLine}`;
                    continue;
                }
                if (line.match(tagStart) && line.includes(':')) {
                    // We're on to a new tag, which means we've collected
                    // the full value of the old tag. Add the old tag to
                    // the collection.
                    if (tag) {
                        parser.bagItFile.keyValueCollection.add(tag, value);
                    }
                    var parts = line.split(':');
                    tag = parts[0].trim();
                    value = parts[1].trim();
                }
            }
            // Add the tag from the last line of the file, if there was one.
            if (tag) {
                parser.bagItFile.keyValueCollection.add(tag, value);
            }
            Context.logger.debug(`Finished parsing tag file ${parser.bagItFile.absPath}`);
        });
    }
}

module.exports.TagFileParser = TagFileParser;
