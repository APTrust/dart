const { Readable } = require('stream');
/**
  * DummyReader implements the read() method of stream.Readable,
  * returning null. This class is sometimes returned by functions
  * whose caller expect a readable stream, which may have no data.
  * For example, when the {@link FileSystemIterator} returns a
  * directory entry, this allows it to return a non-null Readable
  * so the caller won't blow up if it tries to call read().
  */
class DummyReader extends Readable {
    constructor() {
        super();
    }
    /**
     * _read() causes calls to DummyReader.read() to return
     * null and emit the stream end event.
     */
    _read() {
        this.emit('end');
        return null;
    }
}

module.exports.DummyReader = DummyReader;
