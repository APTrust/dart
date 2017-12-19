package bagit

import (
	"fmt"
)

type StorageService struct {
	Id            string `json:"id"`
	Name          string `json:"name"`
	Description   string `json:"description"`
	Protocol      string `json:"protocol"`
	URL           string `json:"url"`
	Bucket        string `json:"bucket"`
	LoginName     string `json:"loginName"`
	LoginPassword string `json:"loginPassword"`
	LoginExtra    string `json:"loginExtra"`
}

func (ss *StorageService) Validate() []error {
	errors := make([]error, 0)
	if ss.Protocol == "" {
		errors = append(errors, fmt.Errorf("Storage service protocol cannot be empty."))
	}
	if ss.URL == "" {
		errors = append(errors, fmt.Errorf("Storage service URL cannot be empty."))
	}
	return errors
}
