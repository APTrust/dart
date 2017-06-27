package core

type Tag struct {
	Label    string   `json:"-"`
	Value    string   `json:"-"`
	Required bool     `json:"required"`
	EmptyOK  bool     `json:"emptyOk"`
	Values   []string `json:"values"`
}

func NewTag(label, value string) *Tag {
	return &Tag{
		Label: label,
		Value: value,
	}
}

func NewTagWithRequirements(label string, required, emptyOk bool, values []string) *Tag {
	return &Tag{
		Label:    label,
		Required: required,
		EmptyOK:  emptyOk,
		Values:   values,
	}
}
