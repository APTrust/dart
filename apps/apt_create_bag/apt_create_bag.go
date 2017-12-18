package main

import (
	"fmt"
	"github.com/APTrust/easy-store/bagit"
	"os"
)

func main() {
	job := loadJob()
	fmt.Println(*job)
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
