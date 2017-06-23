package core

type TagFile struct {
	Path     string
	Required bool
	Tags     []*Tag
}

func NewTagFile(path string) {
	return &TagFile{
		Path: path,
	}
}

func NewTagFileProfile(path string, required bool, tags []*Tag) {
	return &TagFile{
		Path:     path,
		Required: required,
		Tags:     tags,
	}
}
