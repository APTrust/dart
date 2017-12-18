package bagit

import (
	"encoding/json"
	"io/ioutil"
	"regexp"
	"time"
)

var MacJunkFile = regexp.MustCompile(`._DS_Store$|.DS_Store$`)
var DotFile = regexp.MustCompile(`\/\.[^\/]+$|\\\.[^\\]+$`)
var DotKeepFile = regexp.MustCompile(`\/\.keep$|\\\.keep$`)

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

func (job *Job) Validate() []string {
	errors := make([]string, 0)

	// Validate

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
	} else if isDotKeepFile && job.Options.SkipDotKeep {
		return false
	} else if isHiddenFile && job.Options.SkipHiddenFiles {
		return false
	}
	return true
}

func (job *Job) EachFile(f func(string)) {
	// Recurse into directories, call f on each file
	// that passes ShouldIncludeFile test
}
