package core

import (
	"bufio"
	"fmt"
	"io"
	"regexp"
	"strings"
)

type File struct {
	Size      int64
	Checksums map[string]string
	Tags      map[string][]string
}

func NewFile(size int64) *File {
	return &File{
		Size:      size,
		Checksums: make(map[string]string),
		Tags:      make(map[string][]string),
	}
}

func (file *File) ParseAsManifest(reader io.Reader, filePath string) []error {
	errs := make([]error, 0)
	if file.Checksums == nil {
		file.Checksums = make(map[string]string)
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
			file.Checksums[fileName] = digest
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
	if file.Tags == nil {
		file.Tags = make(map[string][]string)
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
				file.addTag(tagName, tagValue)
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
	file.addTag(tagName, tagValue)
	return errs
}

func (file *File) addTag(name, value string) {
	if file.Tags[name] == nil {
		file.Tags[name] = make([]string, 0)
	}
	file.Tags[name] = append(file.Tags[name], value)
}

func (file *File) Write(writer *io.Writer, filePath string) []error {
	return nil
}
