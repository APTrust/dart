const fs = require('fs');
const path = require('path');
const { BagItFile } = require('./bagit_file')
const { TagFileParser } = require('./tag_file_parser')

// See manifest_parser.test.js for comments on Jest async tests.
test('TagFileParser', done => {
    let pathToTagFile = path.join(__dirname, "..", "test", "fixtures", "bag-info.txt");
    let stats = fs.statSync(pathToTagFile);
    let bagItFile = new BagItFile(pathToTagFile, "bag-info.txt", stats);
    expect(bagItFile).not.toBeNull();
    let stream = fs.createReadStream(pathToTagFile);
    expect(stream).not.toBeNull();
    let tagFileParser = new TagFileParser(bagItFile);
    expect(tagFileParser).not.toBeNull();

    function testParseResults() {
        expect(bagItFile.keyValueCollection).not.toBeNull();

        // Parser should have found 10 tags. Even though the tag called
        // "Duplicate-Tag" appears three times, it's counted as one tag
        // with multiple values.
        expect(bagItFile.keyValueCollection.keys().length).toEqual(10);
        expect(bagItFile.keyValueCollection.first("Source-Organization")).toEqual("test.edu");
        expect(bagItFile.keyValueCollection.first("Bagging-Date")).toEqual("2018-10-17T20:45:08Z");
        expect(bagItFile.keyValueCollection.first("Bag-Count")).toEqual("1 of 1");
        expect(bagItFile.keyValueCollection.first("Bag-Group-Identifier")).toEqual("Photos of Trees");
        expect(bagItFile.keyValueCollection.first("Internal-Sender-Description")).toEqual("Photographs from May-June 2018 of trees in Charlottesville.");
        expect(bagItFile.keyValueCollection.first("Internal-Sender-Identifier")).toEqual("PH-Arbor-2018.1");
        expect(bagItFile.keyValueCollection.first("Duplicate-Tag")).toEqual("First value of duplicate tag.");
        expect(bagItFile.keyValueCollection.first("Payload-Oxum")).toEqual("236884.8");
        expect(bagItFile.keyValueCollection.first("Final-Tag")).toEqual("This tag has leading whitespace that should be trimmed.");

        // Make sure our multiline tag comes out right...
        expect(bagItFile.keyValueCollection.first("Multiline-Tag")).toEqual("The value for this tag spans multiple lines, which is allowed under section 2.2.2 of the BagIt specification, as described at this url: https://tools.ietf.org/html/draft-kunze-bagit-17#section-2.2.2. The spec also says a tag can appear multiple times, and tag parsers should preserve all the values in the order they appeared. That's also described under section 2.2.2.");

        // Make sure our multi-value tag comes out right.
        // Note that all() returns all of the tag's values,
        // and they should be in order.
        expect(bagItFile.keyValueCollection.all("Duplicate-Tag")).toEqual(["First value of duplicate tag.","Second value of duplicate tag.","Third value of duplicate tag."]);

        done();
    }

    // We can attach to either stream end or tagFileParser.stream end.
    // Only the latter is reliable, because the TagFileParser assigns
    // all of its values on its own internal stream end.
    tagFileParser.stream.on('end', testParseResults);
    stream.pipe(tagFileParser.stream);
});
