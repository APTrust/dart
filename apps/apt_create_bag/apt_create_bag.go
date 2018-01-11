package main

import (
	"bufio"
	"encoding/json"
	"flag"
	"fmt"
	"github.com/APTrust/easy-store/bagit"
	"github.com/APTrust/easy-store/util/fileutil"
	"io"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	job := loadJob()
	bagPath, err := createBag(job)
	if err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		os.Exit(1)
	} else {
		fmt.Println("Created", bagPath)
	}
}

func createBag(job *bagit.Job) (string, error) {
	bagPath := filepath.Join(job.BaggingDirectory, job.BagName)
	if job.BagItProfile.MustBeTarred() && !strings.HasSuffix(bagPath, ".tar") {
		bagPath += ".tar"
	}

	bagger, err := bagit.NewBagger(bagPath, job.BagItProfile)
	if err != nil {
		return "", err
	}

	// Add files
	for _, fpath := range job.Files {
		if fileutil.IsFile(fpath) {
			addFile(bagger, job, fpath)
		} else if fileutil.IsDir(fpath) {
			err := filepath.Walk(fpath, func(filePath string, f os.FileInfo, err error) error {
				var e error
				if f != nil && f.Mode().IsRegular() {
					e = addFile(bagger, job, filePath)
				}
				return e
			})
			if err != nil {
				fmt.Fprintln(os.Stderr, err.Error())
				os.Exit(1)
			}
		}
	}

	// Add tags
	for _, tagDef := range job.BagItProfile.RequiredTags {
		// Empty tags can come from Easy Store UI for custom tag files.
		if tagDef.TagName == "" && tagDef.UserValue == "" {
			continue
		}
		kvp := bagit.NewKeyValuePair(tagDef.TagName, tagDef.UserValue)
		bagger.AddTag(tagDef.TagFile, &kvp)
	}

	// Write bag
	fmt.Println("Writing bag to", bagPath)
	if job.BagItProfile.MustBeTarred() {
		bagger.WriteBagToTarFile(true, true)
	} else {
		bagger.WriteBag(true, true)
	}

	errors := bagger.Errors()
	for _, errMsg := range errors {
		fmt.Fprintln(os.Stderr, errMsg)
	}
	if len(errors) > 0 {
		os.Exit(1)
	}

	// Validate bag
	bag := bagit.NewBag(bagPath)
	validator := bagit.NewValidator(bag, job.BagItProfile)
	fmt.Println("Validating bag at", bagPath)
	if !validator.Validate() {
		fmt.Fprintln(os.Stderr, "Bag failed validation with the following errors:")
		for _, errMsg := range validator.Errors() {
			fmt.Fprintln(os.Stderr, errMsg)
		}
		os.Exit(1)
	} else {
		fmt.Println("Bag at", bagPath, "is valid")
	}

	return bagPath, nil
}

func addFile(bagger *bagit.Bagger, job *bagit.Job, sourcePath string) error {
	if job.ShouldIncludeFile(sourcePath) {
		relPath := "data" + sourcePath
		fmt.Println("Adding", sourcePath)
		if !bagger.AddFile(sourcePath, relPath) {
			errors := bagger.Errors()
			lastError := errors[len(errors)-1]
			return fmt.Errorf(lastError)
		}
	} else {
		fmt.Println("Skipping", sourcePath)
	}
	return nil
}

func loadJob() *bagit.Job {
	var stdin bool
	flag.BoolVar(&stdin, "stdin", false, "Load job from stdin instead of reading from file.")
	flag.Parse()
	if stdin {
		job, err := loadJobFromStdin()
		if err != nil {
			fmt.Fprintln(os.Stderr, err.Error())
			os.Exit(1)
		}
		return job
	}

	if len(os.Args) < 2 {
		fmt.Fprintln(os.Stderr, "You must specify a job file, or pass the job JSON in through STDIN.")
		os.Exit(1)
	}
	job, err := bagit.LoadJobFromFile(os.Args[1])
	if err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		os.Exit(1)
	}
	errors := job.Validate()
	if len(errors) > 0 {
		for _, err := range errors {
			fmt.Fprintln(os.Stderr, err.Error())
		}
		os.Exit(1)
	}
	return job
}

func loadJobFromStdin() (*bagit.Job, error) {
	jsonBytes := make([]byte, 0)
	data := make([]byte, 4096)
	reader := bufio.NewReader(os.Stdin)
	for {
		bytesRead, err := reader.Read(data)
		jsonBytes = append(jsonBytes, data[0:bytesRead]...)
		if err != nil {
			if err == io.EOF {
				break
			}
			fmt.Fprintln(os.Stderr, err.Error())
			os.Exit(1)
		}
		if bytesRead < len(data) {
			break
		}
	}
	job := &bagit.Job{}
	err := json.Unmarshal(jsonBytes, job)
	return job, err
}
