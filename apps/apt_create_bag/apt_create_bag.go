package main

import (
	"fmt"
	"github.com/APTrust/easy-store/bagit"
	"os"
	"path/filepath"
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
	_, err := bagit.NewBagger(bagPath, job.BagItProfile)
	if err != nil {
		return "", err
	}

	// Add files
	// Write bag

	return bagPath, nil
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
	return job
}
