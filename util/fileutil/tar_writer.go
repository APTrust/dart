package fileutil

import (
	"archive/tar"
	"fmt"
	"io"
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

// Adds a file to a tar archive.
func (writer *TarWriter) AddToArchive(filePath, pathWithinArchive string) error {
	if writer.tarWriter == nil {
		return fmt.Errorf("Underlying TarWriter is nil. Has it been opened?")
	}
	finfo, err := os.Stat(filePath)
	if err != nil {
		return fmt.Errorf("Cannot add '%s' to archive: %v", filePath, err)
	}
	header := &tar.Header{
		Name:    pathWithinArchive,
		Size:    finfo.Size(),
		Mode:    int64(finfo.Mode().Perm()),
		ModTime: finfo.ModTime(),
	}

	// Write the header entry
	if err := writer.tarWriter.WriteHeader(header); err != nil {
		// Most likely error is archive/tar: write after close
		return err
	}

	// Open the file whose data we're going to add.
	file, err := os.Open(filePath)
	defer file.Close()
	if err != nil {
		return err
	}

	// Copy the contents of the file into the tarWriter.
	bytesWritten, err := io.Copy(writer.tarWriter, file)
	if bytesWritten != header.Size {
		return fmt.Errorf("addToArchive() copied only %d of %d bytes for file %s",
			bytesWritten, header.Size, filePath)
	}
	if err != nil {
		return fmt.Errorf("Error copying %s into tar archive: %v",
			filePath, err)
	}

	return nil
}
