package core

type File struct {
	Path      string
	Size      int64
	Checksums map[string]string
}
