const { KeyValueCollection } = require('./key_value_collection');
const { PassThrough } = require('stream');

const spaces = /\s+/;
const newline = "\n";

/**
 * ManifestParser parses text-based payload and tag manifests that
 * conform to the BagIt spec. These files have the following format:
 *
 * 924238a7018a567062c6527675fcf1c0  data/docs/index.html
 *
 * The first item on each line is a checksum and the second is the
 * relative path (within the bag) of the file it was calculated from.
 * The two items are separated by one or more spaces.
 *
 * This class has no methods. It simply responds to events on the stream
 * you pipe into it. After parsing the stream, it stores the data it
 * has parsed in bagItFile.keyValueCollection. Within that collection,
 * you can use the first() method to look up the checksum for a file.
 *
 * You can attach your own callback to the ManifestParser.stream end
 * event, if you want to do something with the BagItFile or (more likely)
 * its keyValueCollection when parsing completes.
 *
 * @param {BagItFile} bagItFile - A BagItFile object. If the object
 * does not already have a keyValueCollection, the parser will create
 * one.
 *
 * For more on the BagIt spec,
 * see {@link https://tools.ietf.org/html/draft-kunze-bagit-17|BagIt Spec}
 *
 * For info about how to read the parsed data from the file, see {@link KeyValueCollection}
 *
 * @example
 *
 * // Set up a BagItFile. Note the file itself is a payload manifest.
 * let pathToManifest = "/path/to/bag-info.txt";
 * let stats = fs.statSync(pathToManifest);
 * let bagItFile = new BagItFile(pathToManifest, "manifest-sha256.txt", stats);
 *
 * // Open the BagItFile for reading
 * let stream = fs.createReadStream(pathToManifest);
 *
 * // Create a new ManifestParser to parse the BagItFile
 * let manifestParser = new ManifestParser(bagItFile);
 *
 * // Optional: Hook up your callback to do something with
 * // bagItFile when the parsing is done.
 * manifestParser.stream.on('end', YOUR_CALLBACK_HERE);
 *
 * // Required: Pipe your file reader into the parser.
 * stream.pipe(manifestParser.stream).on('error', function(e){handleError(e)});
 *
 */
class ManifestParser {
    constructor(bagItFile) {
        /**
          * bagItFile is the file that will be parsed.
          * When parsing is complete, bagItFile.keyValueCollection
          * will be populated with relative file paths and
          * the checksum digests that correspond to those paths.
          *
          * @type {BagItFile}
          */
        this.bagItFile = bagItFile;

        /**
          * stream is a PassThrough stream that allows
          * for data to be piped from a ReadStream into
          * the parser. You can attach your own 'data' and
          * 'end' events to this stream, but the parser
          * already does the parsing work for you.
          *
          * @type {stream.PassThrough}
          */
        this.stream = new PassThrough();
        this.stream.setEncoding('utf8');

        /**
         * lastFragment is the last chunk of raw data from
         * the Readable stream.
         *
         * @private
         * @type {string}
         */
        this.lastFragment = '';

        var parser = this;
        if (bagItFile.keyValueCollection == null) {
            bagItFile.keyValueCollection = new KeyValueCollection();
        }

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
                    //Context.logger.debug(`"${filename}" = "${fixityValue}"`);
                    if (filename != '' && fixityValue != '') {
                        parser.bagItFile.keyValueCollection.add(filename, fixityValue);
                    }
                }
            }
        });

        // Handle end of stream
        parser.stream.on('end', function() {
            //Context.logger.debug(`Finished parsing manifest ${parser.bagItFile.absPath}`);
        });
    }
}

module.exports.ManifestParser = ManifestParser;
