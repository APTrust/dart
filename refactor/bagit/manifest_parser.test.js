const fs = require('fs');
//const os = require('os');
const path = require('path');
const { BagItFile } = require('./bagit_file')
const { ManifestParser } = require('./manifest_parser')

test('ManifestParser', done => {
    let pathToManifest = path.join(__dirname, "..", "test", "fixtures", "manifest-sha256.txt");
    let stats = fs.statSync(pathToManifest);
    let bagItFile = new BagItFile(pathToManifest, "manifest-sha256.txt", stats);
    expect(bagItFile).not.toBeNull();
    let stream = fs.createReadStream(pathToManifest);
    expect(stream).not.toBeNull();
    let manifestParser = new ManifestParser(bagItFile);
    expect(manifestParser).not.toBeNull();
    stream.pipe(manifestParser.stream);

    // Force test to await completion of stream reading
    function parseManifest() {
        expect(bagItFile.keyValueCollection).not.toBeNull();

        // TODO: Test exact keys and values...
        // expect(bagItFile.keyValueCollection.keys().length).toEqual(4);
        done();
    }

    parseManifest();
});
