package main

import (
	"fmt"
	"github.com/APTrust/easy-store/bagit"
	"os"
)

func main() {

}

func getJobFile() string {
	if len(os.Args) < 2 {
		fmt.Fprintln(os.Stderr, "You must specify a job file.")
		os.Exit(1)
	}
}

func loadJobFile() {

}
