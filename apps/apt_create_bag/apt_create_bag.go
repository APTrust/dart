package main

import (
	"fmt"
	"github.com/APTrust/easy-store/bagit"
	"github.com/APTrust/easy-store/util"
	"github.com/APTrust/easy-store/util/fileutil"
	"os"
	"path/filepath"
	"strings"
	"sync"
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
	// TODO: *** PRESERVE TIMESTAMPS ON COPY ***
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
	if len(errors) > 0 {
		os.Exit(1)
	}

	// Tar the bag, if required
	// TODO: This will have to be more flexible in the future.
	// TODO: Clean this up
	// TODO: *** TAR WRITER MUST PRESERVE USER/GROUP ***
	validationPath := bagPath
	canTar := util.StringListContains(job.BagItProfile.AcceptSerialization, "application/tar")
	if canTar && job.BagItProfile.Serialization == "required" {
		algorithms := make([]string, 0)
		tarPath := bagPath + ".tar"
		validationPath = tarPath
		fmt.Println("Tarring bag to", tarPath)
		writer := fileutil.NewTarWriter(tarPath)
		writer.Open()
		defer writer.Close()

		var wg sync.WaitGroup

		err := filepath.Walk(bagPath, func(filePath string, f os.FileInfo, err error) error {
			wg.Add(1)
			var e error
			if f != nil && f.Mode().IsRegular() {
				relPath := strings.Replace(filePath, job.BaggingDirectory+"/", "", 1)
				_, e := writer.AddToArchive(filePath, relPath, algorithms)
				if e != nil {
					fmt.Fprintf(os.Stderr, e.Error())
				}
			}
			wg.Done()
			return e
		})

		wg.Wait()

		if err != nil {
			fmt.Fprintf(os.Stderr, err.Error())
		}
	}

	// Validate bag
	bag := bagit.NewBag(validationPath)
	validator := bagit.NewValidator(bag, job.BagItProfile)
	fmt.Println("Validating bag at", validationPath)
	if !validator.Validate() {
		fmt.Fprintln(os.Stderr, "Bag failed validation with the following errors:")
		for _, errMsg := range validator.Errors() {
			fmt.Fprintln(os.Stderr, errMsg)
		}
		os.Exit(1)
	} else {
		fmt.Println("Bag at", validationPath, "is valid")
	}

	// Delete the bag directory that we just tarred up
	if strings.HasSuffix(validationPath, ".tar") && validationPath != bagPath {
		if fileutil.LooksSafeToDelete(bagPath, 12, 3) {
			fmt.Println("Deleting bag directory", bagPath)
			fmt.Println("Bag is in", validationPath)
			os.RemoveAll(bagPath)
		}
	}

	return validationPath, nil
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
