package core

type Bagger struct {
	Bag      *Bag
	Profile  *BagItProfile
	Sources  []string
	Defaults map[string]string
}

// sources is a list of source files/directories to put into the data dir.
// defaults is a map of default tag values.
func NewBagger(bag *Bag, profile *BagItProfile, sources []string, defaults map[string]string) *Bagger {
	return &Bagger{
		Bag:     bag,
		Profile: profile,
		Sources: sources,
	}
}

/*

- Validate Profile
- Validate that all defaults are present
- Include progress callback or io.Writer for writing progress messages
- Add all payload files to bag in working dir
- Create manifests

- Tar bag if serialization is required and serlialization format is tar?
- Provide a way of specifying tag files and where to put them?
- Parse existing tag files, and skip defaults if they're already defined in existing tag files?

*/
