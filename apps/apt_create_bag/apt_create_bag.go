package main

import (
	"fmt"
	"github.com/APTrust/easy-store/bagit"
	"github.com/APTrust/easy-store/util/fileutil"
	"os"
	"path"
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
	bagger, err := bagit.NewBagger(bagPath, job.BagItProfile)
	if err != nil {
		return "", err
	}

	// Add files
	for _, fpath := range job.Files {
		if fileutil.IsFile(fpath) {
			baseDir := path.Dir(fpath)
			addFile(bagger, job, fpath, baseDir)
		} else if fileutil.IsDir(fpath) {
			err := filepath.Walk(fpath, func(filePath string, f os.FileInfo, err error) error {
				var e error
				if f != nil && f.IsDir() == false {
					e = addFile(bagger, job, filePath, fpath)
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

	// Write bag
	if !bagger.WriteBag(true, false) {
		errors := bagger.Errors()
		for _, errMsg := range errors {
			fmt.Fprintln(os.Stderr, errMsg)
		}
	}

	return bagPath, nil
}

func addFile(bagger *bagit.Bagger, job *bagit.Job, sourcePath, baseDir string) error {
	if job.ShouldIncludeFile(sourcePath) {
		relPath := strings.Replace(sourcePath, baseDir, "data", 1)
		fmt.Println("Adding", sourcePath, "at", relPath)
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
	if len(os.Args) < 2 {
		fmt.Fprintln(os.Stderr, "You must specify a job file.")
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
