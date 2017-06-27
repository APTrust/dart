package core

type Bag struct {
	Name      string
	Files     []*File
	Manifests []*Manifest
	Path      string
	TagFiles  map[string][]*Tag
}

func NewBag(name, filePath string) *Bag {
	return &Bag{
		Name: name,
		Path: filePath,
	}
}
