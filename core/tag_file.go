package core

type TagFile struct {
	Path     string
	Required bool
	Tags     []*Tag
}

func NewTagFile(path string) *TagFile {
	return &TagFile{
		Path: path,
	}
}

func NewTagFileWithRequirements(path string, required bool, tags []*Tag) *TagFile {
	return &TagFile{
		Path:     path,
		Required: required,
		Tags:     tags,
	}
}
