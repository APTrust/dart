package bagit

type JobOptions struct {
	SkipDSStore     bool `json:"skipDSStore"`
	SkipHiddenFiles bool `json:"skipHiddenFiles"`
	SkipDotKeep     bool `json:"skipDotKeep"`
}
