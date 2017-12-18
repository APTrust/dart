package bagit

import (
	"encoding/json"
	"io/ioutil"
	"time"
)

type Job struct {
	Id              string            `json:"id"`
	BagName         string            `json:"bagName"`
	Files           []string          `json:"files"`
	BagItProfile    *BagItProfile     `json:"bagItProfile"`
	StorageServices []*StorageService `json:"storageServices"`
	Options         *JobOptions       `json:"options"`
	Created         time.Time         `json:"created"`
	Update          time.Time         `json:"updated"`
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
