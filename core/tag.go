package core

type Tag struct {
	Label    string
	Value    string
	Required bool
	Values   []string
}

func NewTag(label, value string) *Tag {
	return &Tag{
		Label: label,
		Value: value,
	}
}

func NewTagWithAllowedValues(label string, required bool, values []string) *Tag {
	return &Tag{
		Label:    label,
		Required: required,
		Values:   values,
	}
}
