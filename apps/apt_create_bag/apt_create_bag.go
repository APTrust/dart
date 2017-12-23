package main

import (
	"bufio"
	"encoding/json"
	"flag"
	"fmt"
	"github.com/APTrust/easy-store/bagit"
	//	"github.com/APTrust/easy-store/util"
	"github.com/APTrust/easy-store/util/fileutil"
	"io"
	"os"
	"path/filepath"
	"strings"
	//	"sync"
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

	// // Tar the bag, if required
	// // TODO: This will have to be more flexible in the future.
	// // TODO: Clean this up
	// // TODO: *** TAR WRITER MUST PRESERVE USER/GROUP ***
	// validationPath := bagPath
	// canTar := util.StringListContains(job.BagItProfile.AcceptSerialization, "application/tar")
	// if canTar && job.BagItProfile.Serialization == "required" {
	//	algorithms := make([]string, 0)
	//	tarPath := bagPath + ".tar"
	//	validationPath = tarPath
	//	fmt.Println("Tarring bag to", tarPath)
	//	writer := fileutil.NewTarWriter(tarPath)
	//	writer.Open()
	//	defer writer.Close()

	//	var wg sync.WaitGroup

	//	err := filepath.Walk(bagPath, func(filePath string, f os.FileInfo, err error) error {
	//		wg.Add(1)
	//		var e error
	//		if f != nil && f.Mode().IsRegular() {
	//			relPath := strings.Replace(filePath, job.BaggingDirectory+"/", "", 1)
	//			_, e := writer.AddToArchive(filePath, relPath, algorithms)
	//			if e != nil {
	//				fmt.Fprintf(os.Stderr, e.Error())
	//			}
	//		}
	//		wg.Done()
	//		return e
	//	})

	//	wg.Wait()

	//	if err != nil {
	//		fmt.Fprintf(os.Stderr, err.Error())
	//	}
	// }

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

	// Delete the bag directory that we just tarred up
	// if strings.HasSuffix(validationPath, ".tar") && validationPath != bagPath {
	//	if fileutil.LooksSafeToDelete(bagPath, 12, 3) {
	//		fmt.Println("Deleting bag directory", bagPath)
	//		fmt.Println("Bag is in", validationPath)
	//		os.RemoveAll(bagPath)
	//	}
	// }

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
