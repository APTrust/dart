package core

type Bag struct {
	Name      string
	Files     []*File
	Manifests []*Manifest
	Path      string
	TagFiles  []*TagFile
}

func NewBag(name, filePath string) *Bag {
	return &Bag{
		Name: name,
		Path: filePath,
	}
}
