package fileutil

import (
	"archive/tar"
	"fmt"
	"io"
	"os"
	"regexp"
	"strings"
)

// TarFileIterator lets us read tarred bags (or any other tarred files)
// without having to untar them.
type TarFileIterator struct {
	tarReader        *tar.Reader
	file             *os.File
	topLevelDirNames []string
}

// NewTarFileIterator returns a new TarFileIterator. Param pathToTarFile
// should be an absolute path to the tar file.
func NewTarFileIterator(pathToTarFile string) (*TarFileIterator, error) {
	file, err := os.Open(pathToTarFile)
	if err != nil {
		return nil, err
	}
	return &TarFileIterator{
		tarReader:        tar.NewReader(file),
		file:             file,
		topLevelDirNames: make([]string, 0),
	}, nil
}

// Next returns an open reader for the next file, along with a FileSummary.
// Returns io.EOF when it reaches the last file.
func (iter *TarFileIterator) Next() (io.ReadCloser, *FileSummary, error) {
	header, err := iter.tarReader.Next()
	if err != nil {
		// Error may be io.EOF, which just means we
		// reached the end of the headers.
		return nil, nil, err
	}
	iter.setTopLevelDirName(header.Name)
	// trimPrefix is the bag's top-level directory name,
	// which we want to trim from the header path to get
	// the file's actual relative path within the bag.
	// E.g. "bag_1337/data/image.jpg" should be trimmed
	// to "data/image.jpg" to match up against entries
	// in the payload manifests.
	trimPrefix := strings.Split(header.Name, "/")[0] + "/"
	fs, err := NewFileSummaryFromTarHeader(header, trimPrefix)
	// Wrap our tar reader in a TarReadCloser. When the caller
	// calls Read() on this object, it will read to the end
	// of whatever file the current header describes.
	tarReadCloser := TarReadCloser{
		tarReader: iter.tarReader,
	}
	return tarReadCloser, fs, nil
}

// OpenFile returns an open reader for the file with the specified name,
// or nil if that file cannot be found. Caller is responsible
// for closing the reader. Note that the iterator is forward-only,
// which makes it unsuitable for re-use. Create a new iterator each
// time you want to call OpenFile.
func (iter *TarFileIterator) OpenFile(filePath string) (io.ReadCloser, error) {
	for {
		header, err := iter.tarReader.Next()
		if err != nil {
			// Error may be io.EOF, which just means we
			// reached the end of the headers.
			return nil, fmt.Errorf("File '%s' not found in archive", filePath)
		}
		if header.Name == filePath {
			tarReadCloser := TarReadCloser{
				tarReader: iter.tarReader,
			}
			return tarReadCloser, nil
		}
	}
}

// FindMatchingFiles returns a list of files whose names match
// the supplied regular expression. You must create a new iterator
// each time you call this, since tar file iterators are forward-only.
func (iter *TarFileIterator) FindMatchingFiles(regex *regexp.Regexp) ([]string, error) {
	matches := make([]string, 0)
	for {
		header, err := iter.tarReader.Next()
		if err != nil {
			if err == io.EOF {
				return matches, nil
			} else {
				return matches, err
			}
		}
		relPathInArchive := (strings.Join(strings.Split(header.Name, "/")[1:], "/"))
		if regex.MatchString(relPathInArchive) {
			matches = append(matches, relPathInArchive)
		}
	}
	return matches, nil
}

// Keep track of any top-level directory names we encounter.
// The BagIt spec says a tar file SHOULD untar to a directory with the
// same name as the tar file, minus the .tar extension. The APTrust
// spect says it MUST untar to a directory with that name. When we're
// validating bags, we'll want to know the name of the top-level
// directory, keeping in mind that the tar file may deserialize to
// multiple top-level directories.
func (iter *TarFileIterator) setTopLevelDirName(headerName string) {
	topLevelDir := strings.Split(headerName, "/")[0]
	for i := range iter.topLevelDirNames {
		if iter.topLevelDirNames[i] == topLevelDir {
			return
		}
	}
	iter.topLevelDirNames = append(iter.topLevelDirNames, topLevelDir)
}

// GetTopLevelDirNames returns the names of the top level directories to which
// the tar file expands. For APTrust purposes, the tar file should expand to
// one directory whose name matches that of the tar file, minus the
// .tar extension. In reality, tar files can expand to multiple
// top-level directories with any names.
//
// Note that you should read the entire tar file before calling
// this; otherwise, you may not get all the top-level dir names.
func (iter *TarFileIterator) GetTopLevelDirNames() []string {
	return iter.topLevelDirNames
}

// Close closes the underlying tar file.
func (iter *TarFileIterator) Close() {
	if iter.file != nil {
		iter.file.Close()
	}
}

// TarReaderCloser implements the io.ReadCloser interface.
type TarReadCloser struct {
	tarReader *tar.Reader
}

// Read reads bytes into buffer p, returning number of bytes read
// and an error, if there was one.
func (tarReadCloser TarReadCloser) Read(p []byte) (int, error) {
	return tarReadCloser.tarReader.Read(p)
}

// Close is a no-op that pretends to close something that is not
// a file and does not need to be closed.
func (tarReadCloser TarReadCloser) Close() error {
	return nil // noop
}
