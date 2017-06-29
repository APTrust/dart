package core

type Bag struct {
	Name      string
	Path      string
	Files     map[string]*File
	Manifests map[string]map[string]string
	TagFiles  map[string][]*Tag
}

func NewBag(name, filePath string) *Bag {
	return &Bag{
		Name: name,
		Path: filePath,
	}
}
