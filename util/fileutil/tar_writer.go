package fileutil

import (
	"archive/tar"
	"fmt"
	"os"
)

type TarWriter struct {
	PathToTarFile string
	tarWriter     *tar.Writer
}

func NewTarWriter(pathToTarFile string) *TarWriter {
	return &TarWriter{
		PathToTarFile: pathToTarFile,
	}
}

func (writer *TarWriter) Open() error {
	tarFile, err := os.Create(writer.PathToTarFile)
	if err != nil {
		return fmt.Errorf("Error creating tar file: %v", err)
	}
	writer.tarWriter = tar.NewWriter(tarFile)
	return nil
}

func (writer *TarWriter) Close() error {
	if writer.tarWriter != nil {
		return writer.tarWriter.Close()
	}
	return nil
}

// AddToArchive copies the file at filePath into the tar archive
// at pathWithin archive (its relative path within the archive).
// It computes the digests specified in algorithms along the way,
// and returns those in the form of a map. Supported digest algorithms
// are listed in constants.HashAlgorithms.
//
// For example, to add the file "/usr/local/image.jpg" into the
// tar archive at "data/photo.jpg", and get back the file's
// md5 and sha256 checksums, you would call this:
//
// checksums, err := tarWriter.AddToArchive("/usr/local/image.jpg", "data/photo.jpg", []string{ "md5", "sha256"})
//
// You'll get back a map that looks like this:
//
// { "md5": "1234567", "sha256": "890abcd" }
//
// The checksum map will be nil when there's an error.
func (writer *TarWriter) AddToArchive(filePath, pathWithinArchive string, algorithms []string) (map[string]string, error) {
	if writer.tarWriter == nil {
		return nil, fmt.Errorf("Underlying TarWriter is nil. Has it been opened?")
	}
	finfo, err := os.Stat(filePath)
	if err != nil {
		return nil, fmt.Errorf("Cannot add '%s' to archive: %v", filePath, err)
	}
	linkTarget := ""
	if finfo.Mode()&os.ModeSymlink != 0 {
		// This is a symlink
		linkTarget, err = os.Readlink(filePath)
		if err != nil {
			return nil, fmt.Errorf("Error getting target of symlink '%s': %v", filePath, err)
		}
	}

	// Create the tar header with all the info we can get:
	// modtime, uid, gid, permissions, etc. Then we have to manually set
	// the headerName, because finfo may include only the
	// file's basename. See comments in FileInfoHeader at
	// https://golang.org/src/archive/tar/common.go?s=5939:6004#L193
	header, err := tar.FileInfoHeader(finfo, linkTarget)
	header.Name = pathWithinArchive

	// Write the header entry
	if err := writer.tarWriter.WriteHeader(header); err != nil {
		// Most likely error is archive/tar: write after close
		return nil, err
	}

	// Open the file whose data we're going to add.
	file, err := os.Open(filePath)
	defer file.Close()
	if err != nil {
		return nil, err
	}

	return WriteWithChecksums(file, writer.tarWriter, algorithms)
}
