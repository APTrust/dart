package core

type TagFile struct {
	Path string `json:"-"`
	Tags []*Tag
}

func NewTagFile(path string) *TagFile {
	return &TagFile{
		Path: path,
	}
}

func NewTagFileWithTags(path string, tags []*Tag) *TagFile {
	return &TagFile{
		Path: path,
		Tags: tags,
	}
}
