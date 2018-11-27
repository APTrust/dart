# Format Plugins

Format plugins implement methods to read and write certain file formats so we
can read and write, for example, tar files, zip files, files on the native
file system, etc.

## Principles

1. Read directly from a formatted file (tar, zip, etc.) without having to upack
   it onto the file system.
2. Write directly to a formatted file (tar, zip, etc.) instead of writing to
   the filesystem and then converting.
3. Use read and write streams instead of memory buffers to avoid exhausting
   system memory.
4. Limit the number of open read/write streams to avoid exhausting system
   limits.
5. Use Node's stream piping capabilities if you're going to perform multiple
   operations on a file or stream.

(1 - 2) Format plugins should be able to read to and write from the format
(tar, zip, etc.) without having to unpack contents onto the file system. A tar
reader, for example, should be able to read directly from the tar file without
first unpacking it. A tar writer should be able to write directly into a tar
file instead of first writing to the file system and then packing up all of the
files. Direct reading and writing saves a considerable amount of time and disk
space when we're working with multi-gigabyte packages.

(3) Wherever possible, readers and writers should use streams to read and write
the contents. They should not accumulate contents in memory and then write them
out to disk, since this will exhaust system memory.

(4) Readers and writers must limit the number of open read/write streams.
Developers have to be careful with asynchronous functions that open streams and
then pass them on to some other function for processing. The initial function
may open thousands of streams before the processing functions catch up. That
results in the system having too many open file handles. Open and streams only
at the time of processing, and close them immediately. Throttle the number of
concurrent open streams using a library like
[async](https://caolan.github.io/async/) to limit the number of open files.

(5) Use (piping)[https://nodejs.org/api/stream.html#stream_readable_pipe_destination_options]
to perform multiple operations on a stream. Piping prevents you from having to
open and read a file multiple times. For example, when validating APTrust bags
that include both md5 and sha256 tag manifests, piping will let you parse a tag
file and compute both checksums in a single pass.

## Plugin Interfaces for Format Readers and Writers

Format readers:

* must implement a read() method and a list() method.
* both methods must be asynchronous.
* both methods must emit events 'entry', 'error', and 'finish'
* the entry object returned by the read() method must include an open reader
  for the underlying file
* the reader must pause until entry.stream emits its 'end' event
* the reader should limit the number of open read streams to one or a handful
  at any given time.

Format writers:

* must implent an add() method.
* must emit a 'finish' event when all writing is complete.
* should limit the number of open write streams to one or a handful at any
  given time.

For examples of how to implement format readers and writers, see TarReader,
TarWriter, FileSystemReader, and FileSystemWriter.
