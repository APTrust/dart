package core

import (
	"bufio"
	"fmt"
	"io"
	"regexp"
	"strings"
)

type File struct {
	// Size is the size of the file, in bytes.
	Size int64
	// Checksums are the checksums we've calculated for this file.
	// Key is algorithm (e.g. "md5", "sha256") value is hex digest.
	Checksums map[string]string
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

func NewFile(size int64) *File {
	return &File{
		Size:       size,
		Checksums:  make(map[string]string),
		ParsedData: NewKeyValueCollection(),
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

func (file *File) Write(writer *io.Writer, filePath string) []error {
	return nil
}
