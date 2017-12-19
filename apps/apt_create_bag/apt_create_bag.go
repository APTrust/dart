package main

import (
	"fmt"
	"github.com/APTrust/easy-store/bagit"
	"github.com/APTrust/easy-store/util/fileutil"
	"os"
	"path/filepath"
	"time"
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
		kvp := bagit.NewKeyValuePair(tagDef.TagName, tagDef.UserValue)
		if tagDef.TagFile == "bag-info.txt" {
			if tagDef.TagName == "Bagging-Date" {
				kvp.Value = time.Now().Format("2006-01-02")
			} else if tagDef.TagName == "Payload-Oxum" {
				kvp.Value = bagger.GetPayloadOxum()
			}
		}
		bagger.AddTag(tagDef.TagFile, &kvp)
	}

	// Write bag
	bagger.WriteBag(true, true)

	errors := bagger.Errors()
	for _, errMsg := range errors {
		fmt.Fprintln(os.Stderr, errMsg)
	}

	return bagPath, nil
}

func addFile(bagger *bagit.Bagger, job *bagit.Job, sourcePath string) error {
	if job.ShouldIncludeFile(sourcePath) {
		relPath := "data" + sourcePath
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
