package core

// Defaults are default tag values to use when creating bags.
// For example, the value Source-Organization tag will be the
// same for every bag an organization creates. Defaults allow
// us to set these values once.
type Defaults struct {
	// Path is the path to the file that contains the default tag data.
	// The file should be in JSON format, with a single object that
	// contains name-value pairs.
	Path string
	// Values are the default values parsed from the default.json file.
	Values map[string]string
}
