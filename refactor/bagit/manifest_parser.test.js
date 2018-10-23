const fs = require('fs');
const path = require('path');
const { BagItFile } = require('./bagit_file')
const { ManifestParser } = require('./manifest_parser')

// See inline comments below for notes on using done function
// in Jest async tests.
test('ManifestParser', done => {
    let pathToManifest = path.join(__dirname, "..", "test", "fixtures", "manifest-sha256.txt");
    let stats = fs.statSync(pathToManifest);
    let bagItFile = new BagItFile(pathToManifest, "manifest-sha256.txt", stats);
    expect(bagItFile).not.toBeNull();
    let stream = fs.createReadStream(pathToManifest);
    expect(stream).not.toBeNull();
    let manifestParser = new ManifestParser(bagItFile);
    expect(manifestParser).not.toBeNull();

    // This is the function we'll call on stream end.
    // It performs tests to ensure that the file was parsed correctly,
    // then it calls Jest's done() function. If we don't tell
    // Jest to wait for 'done' above, the test function will exit
    // before the reading/parsing of the file completes.
    function testParseResults() {
        expect(bagItFile.keyValueCollection).not.toBeNull();
        // console.log(JSON.stringify(bagItFile));
        // TODO: Test exact keys and values...
        expect(bagItFile.keyValueCollection.keys().length).toEqual(4);
        expect(bagItFile.keyValueCollection.first("data/ORIGINAL/1"))
            .toEqual("cece49c4f50bc7b20e2ab311bd477832e352cc3700264ef9ffc0280ee91d10e2");
        expect(bagItFile.keyValueCollection.first("data/ORIGINAL/1-metadata.xml"))
            .toEqual("60eca5faef45a627d0c1e916026ed6cf91ffe911b5f9b136a3dcc7d99e291519");
        expect(bagItFile.keyValueCollection.first("data/metadata.xml"))
            .toEqual("d277af754c362c65ffc96b8b4393651187f8a5e17ca96d1aef18e9738fa5be23");
        expect(bagItFile.keyValueCollection.first("data/object.properties"))
            .toEqual("8d4b18a74df88c24ab17e67fac4b26b6c8e44a145cc39f93bb7b7a35b622b6f3");
        done();
    }

    stream.on('end', testParseResults);
    stream.pipe(manifestParser.stream);
});
