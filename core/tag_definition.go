package core

type TagDefinition struct {
	Label    string   `json:"label"`
	Required bool     `json:"required"`
	EmptyOk  bool     `json:"emptyOk"`
	Values   []string `json:"values"`
}

func NewTagDefinition(label string, required, emptyOk bool, values []string) *TagDefinition {
	return &TagDefinition{
		Label:    label,
		Required: required,
		EmptyOk:  emptyOk,
		Values:   values,
	}
}
