package bagit

import (
	"time"
)

type Job struct {
	Id              string           `json:"id"`
	BagName         string           `json:"bagName"`
	Files           []string         `json:"files"`
	BagItProfile    BagItProfile     `json:"bagItProfile"`
	StorageServices []StorageService `json:"storageServices"`
	Options         JobOptions       `json:"options"`
	Created         time.Time        `json:"created"`
	Update          time.Time        `json:"updated"`
}
