const { Context } = require('../core/context');
const { KeyValueCollection } = require('./key_value_collection');
const { PassThrough } = require('stream');

const leadingSpaces = /^\s+/;
const newline = "\n";
const tagStart = /^\w+/;

/**
 * TagFileParser parses text-based tag files that conform to the BagIt
 * spec. Since tag files tend to be small (a few kilobytes) and may
 * contain multi-line tags, this parser reads the entire file into
 * memory before parsing tags and values. That is, it accumulates data
 * in the stream.data event and parses it in the stream.end event.
 *
 * This class has no methods. It simply responds to events on stream
 * you pipe into it. After parsing the stream, it stores the data it
 * has parsed in bagItFile.keyValueCollection.
 *
 * You can attach your own callback to the TagFileParser.stream end
 * event, if you want to do something with the BagItFile or (more likely)
 * its keyValueCollection when parsing completes.
 *
 * @param {BagItFile} bagItFile - A BagItFile object. If the object
 * does not already have a keyValueCollection, the parser will create
 * one.
 *
 * @see {@link https://tools.ietf.org/html/draft-kunze-bagit-17|BagIt Spec}
 *
 * @example
 *
 * // Set up a BagItFile
 * let pathToTagFile = "/path/to/bag-info.txt";
 * let stats = fs.statSync(pathToTagFile);
 * let bagItFile = new BagItFile(pathToTagFile, "bag-info.txt", stats);
 *
 * // Open the BagItFile for reading
 * let stream = fs.createReadStream(pathToTagFile);
 *
 * // Create a new TagFileParser to parse the BagItFile
 * let tagFileParser = new TagFileParser(bagItFile);
 *
 * // Optional: Hook up your callback to do something with
 * // bagItFile when the parsing is done.
 * tagFileParser.stream.on('end', YOUR_CALLBACK_HERE);
 *
 * // Required: Pipe your file reader into the parser.
 * stream.pipe(tagFileParser.stream);
 *
 */
class TagFileParser {
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
                    // Unfortunately, JavaScript's split isn't as well
                    // thought out as Golang's split, so we have to do
                    // this Java style. :(
                    var index = line.indexOf(":");
                    tag = line.slice(0, index).trim();
                    value = line.slice(index + 1).trim();
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
