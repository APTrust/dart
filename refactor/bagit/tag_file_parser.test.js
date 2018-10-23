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

        // expect(bagItFile.keyValueCollection.keys().length).toEqual(4);
        // expect(bagItFile.keyValueCollection.first("data/ORIGINAL/1"))
        //     .toEqual("cece49c4f50bc7b20e2ab311bd477832e352cc3700264ef9ffc0280ee91d10e2");
        // expect(bagItFile.keyValueCollection.first("data/ORIGINAL/1-metadata.xml"))
        //     .toEqual("60eca5faef45a627d0c1e916026ed6cf91ffe911b5f9b136a3dcc7d99e291519");
        // expect(bagItFile.keyValueCollection.first("data/metadata.xml"))
        //     .toEqual("d277af754c362c65ffc96b8b4393651187f8a5e17ca96d1aef18e9738fa5be23");
        // expect(bagItFile.keyValueCollection.first("data/object.properties"))
        //     .toEqual("8d4b18a74df88c24ab17e67fac4b26b6c8e44a145cc39f93bb7b7a35b622b6f3");
        done();
    }

    stream.on('end', testParseResults);
    stream.pipe(tagFileParser.stream);
});
