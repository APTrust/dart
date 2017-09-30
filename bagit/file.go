package bagit

import (
	"bufio"
	"bytes"
	"fmt"
	"github.com/APTrust/easy-store/util/fileutil"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

type File struct {
	// Checksums are the checksums we've calculated for this file.
	// Key is algorithm (e.g. "md5", "sha256") value is hex digest.
	Checksums map[string]string
	// FileSummary contains attributes about the file, such as size,
	// mode, modtime, etc.
	FileSummary *fileutil.FileSummary
	// ParsedData is a collection of Key-Value pairs representing
	// data parsed from the file. For manifests and tag manifests,
	// this will be digest info, with the key being the path of
	// the file in the bag, and the value being the digest for that
	// file. For example, "data/image.jpg" => "1234567890abcdef".
	// For parsed tag files, the key will be the tag label and the
	// value will be the parsed value. Note that the BagIt spec
	// says tags may appear more than once, so a single tag may
	// return a list of values.
	ParsedData *KeyValueCollection
}

func NewFile(fs *fileutil.FileSummary) *File {
	return &File{
		FileSummary: fs,
		Checksums:   make(map[string]string),
		ParsedData:  NewKeyValueCollection(),
	}
}

func (file *File) ParseAsManifest(reader io.Reader, filePath string) []error {
	errs := make([]error, 0)
	if file.ParsedData == nil {
		file.ParsedData = NewKeyValueCollection()
	}
	re := regexp.MustCompile(`^(\S*)\s*(.*)`)
	scanner := bufio.NewScanner(reader)
	lineNum := 1
	for scanner.Scan() {
		line := scanner.Text()
		if strings.TrimSpace(line) == "" {
			continue
		}
		if re.MatchString(line) {
			data := re.FindStringSubmatch(line)
			digest := strings.TrimSpace(data[1])
			fileName := strings.TrimSpace(data[2])
			file.ParsedData.Append(fileName, digest)
		} else {
			errs = append(errs, fmt.Errorf(
				"Unable to parse data from line %d of manifest %s: %s",
				lineNum, filePath, line))
		}
		lineNum += 1
	}
	return errs
}

func (file *File) ParseAsTagFile(reader io.Reader, filePath string) []error {
	errs := make([]error, 0)
	if file.ParsedData == nil {
		file.ParsedData = NewKeyValueCollection()
	}
	re := regexp.MustCompile(`^(\S*\:)?(\s*.*)?$`)
	scanner := bufio.NewScanner(reader)
	lineNum := 0
	tagName := ""
	tagValue := ""
	for scanner.Scan() {
		lineNum++
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			// Ignore empty lines.
			continue
		}
		if re.MatchString(line) {
			// We matched a line with tag : value string.
			data := re.FindStringSubmatch(line)
			data[1] = strings.TrimSpace(data[1])
			if tagName != "" {
				file.ParsedData.Append(tagName, tagValue)
			}
			tagName = strings.Replace(data[1], ":", "", 1)
			tagValue = strings.TrimSpace(data[2])
		} else {
			if tagName != "" {
				// This line is a continuation of the value
				// of the last tag.
				tagValue = fmt.Sprintf("%s %s", tagValue, line)
			} else {
				errs = append(errs, fmt.Errorf(
					"Unable to parse data from line %d of tag file %s: %s",
					lineNum, filePath, line))
			}
		}
	}
	if scanner.Err() != nil {
		errs = append(errs, fmt.Errorf("Error reading tag file '%s': %v",
			filePath, scanner.Err().Error()))
	}
	file.ParsedData.Append(tagName, tagValue)
	return errs
}

// Write writes a tag file or checksum manifest to disk.
// File will be written to the specified filePath, and during
// writing, we will calculate checksums for the specified algorithms.
// The checksums will be saved to File.Checksums.
func (file *File) Write(filePath string, algorithms []string) error {
	// Create the output file
	if err := os.MkdirAll(filepath.Dir(filePath), 0755); err != nil {
		return err
	}
	fileOut, err := os.Create(filePath)
	if err != nil {
		return err
	}
	defer fileOut.Close()

	// Load up contents into a single string.
	// Will this be a problem for 100k checksums?
	str := ""
	for _, keyValuePair := range file.ParsedData.Items() {
		field, err := file.formatField(keyValuePair.Key, keyValuePair.Value)
		if err != nil {
			return err
		}
		str += fmt.Sprintf("%s\n", field)
	}

	checksums, err := fileutil.WriteWithChecksums(strings.NewReader(str), fileOut, algorithms)
	if err != nil {
		return err
	}
	file.Checksums = checksums
	return nil
}

func (file *File) formatField(key string, value string) (string, error) {
	// When writing tag files, we want to break lines at 79
	// characters, as recommended by the bagit spec at
	// https://tools.ietf.org/html/draft-kunze-bagit-14#section-2.2.2
	//
	// The delimiter for tag files includes leading spaces for tag
	// values that span more than one line.
	//
	// For manifests, write the value (checksum) first, and the
	// key (filename) after, with no color. Tag files are key first,
	// then colon, then formatted value.
	if fileutil.LooksLikeManifest(file.FileSummary.RelPath) {
		return fmt.Sprintf("%s %s", value, key), nil
	}

	delimiter := "\n   "
	maxLineLength := 79
	var buff bytes.Buffer
	writeLen, err := buff.WriteString(fmt.Sprintf("%s: ", key))
	if err != nil {
		return "", err
	}
	splitCounter := writeLen

	words := strings.Split(value, " ")

	for word := range words {
		if maxLineLength > 0 && splitCounter+len(words[word]) > maxLineLength {
			splitCounter, err = buff.WriteString(delimiter)
			if err != nil {
				return "", err
			}
		}
		writeLen, err = buff.WriteString(strings.Join([]string{" ", words[word]}, ""))
		if err != nil {
			return "", err
		}
		splitCounter += writeLen

	}

	return buff.String(), nil
}
