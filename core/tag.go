package core

type Tag struct {
	Label    string   `json:"label"`
	Value    string   `json:"value"`
	Required bool     `json:"required"`
	EmptyOk  bool     `json:"emptyOk"`
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
		EmptyOk:  emptyOk,
		Values:   values,
	}
}
