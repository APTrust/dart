const { DummyReader } = require("./dummy_reader");

test('DummyReader.read() returns null', () => {
    var reader = new DummyReader();
    expect(reader.read()).toBeNull();
});

test('DummyReader.read() emits end event', done => {
    var reader = new DummyReader();
    reader.on('end', function() {
        // Nothing to test here. If end event doesn't fire,
        // the tests will fail with a timeout exception.
        done();
    });
    reader.read();
});
