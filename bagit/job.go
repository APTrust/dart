package bagit

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"regexp"
	"time"
)

var MacJunkFile = regexp.MustCompile(`._DS_Store$|.DS_Store$`)
var DotFile = regexp.MustCompile(`/\.[^/]+$|\\\.[^\\]+$`)
var DotKeepFile = regexp.MustCompile(`/\.keep$|\\\.keep$`)

type Job struct {
	Id               string            `json:"id"`
	BaggingDirectory string            `json:"baggingDirectory"`
	BagName          string            `json:"bagName"`
	Files            []string          `json:"files"`
	BagItProfile     *BagItProfile     `json:"bagItProfile"`
	StorageServices  []*StorageService `json:"storageServices"`
	Options          *JobOptions       `json:"options"`
	Created          time.Time         `json:"created"`
	Update           time.Time         `json:"updated"`
}

func LoadJobFromFile(filepath string) (*Job, error) {
	jsonBytes, err := ioutil.ReadFile(filepath)
	if err != nil {
		return nil, err
	}
	job := &Job{}
	err = json.Unmarshal(jsonBytes, job)
	return job, err
}

func (job *Job) Validate() []error {
	errors := make([]error, 0)
	if job.Files == nil || len(job.Files) == 0 {
		errors = append(errors, fmt.Errorf("This job has no files."))
	}
	if job.BagItProfile == nil && (job.StorageServices == nil || len(job.StorageServices) == 0) {
		errors = append(errors, fmt.Errorf("This job must have either a BagIt Profile, "+
			"or a Storage Service, or both."))
	}
	if job.BagItProfile != nil {
		if job.BaggingDirectory == "" {
			errors = append(errors, fmt.Errorf("You must specify a bagging directory."))
		}
		profileErrors := job.BagItProfile.Validate()
		if len(profileErrors) > 0 {
			errors = append(errors, profileErrors...)
		}

		for _, tag := range job.BagItProfile.RequiredTags {
			err := tag.Validate()
			if err != nil {
				errors = append(errors, err)
			}
		}
	}
	if job.StorageServices != nil {
		for _, ss := range job.StorageServices {
			ssErrors := ss.Validate()
			if len(ssErrors) > 0 {
				errors = append(errors, ssErrors...)
			}
		}
	}
	return errors
}

func (job *Job) ShouldIncludeFile(filePath string) bool {
	if job.Options == nil {
		return true
	}
	isMacJunkFile := MacJunkFile.MatchString(filePath)
	isHiddenFile := DotFile.MatchString(filePath)
	isDotKeepFile := DotKeepFile.MatchString(filePath)
	skipMacJunk := (job.Options.SkipDSStore || job.Options.SkipDotKeep || job.Options.SkipHiddenFiles)
	if isMacJunkFile && skipMacJunk {
		return false
	} else if (isHiddenFile || isDotKeepFile) && job.Options.SkipDotKeep {
		return false
	} else if (isHiddenFile && !isDotKeepFile) && job.Options.SkipHiddenFiles {
		return false
	}
	return true
}

func (job *Job) EachFile(f func(string)) {
	// Recurse into directories, call f on each file
	// that passes ShouldIncludeFile test
}
