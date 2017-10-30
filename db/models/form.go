package models

import (
	"sort"
	"strconv"
	"strings"
)

// Form is a very basic form structure. All of the layout will be
// set in the templates.
type Form struct {
	Action string
	Method string
	Fields map[string]*Field
}

// NewForm creates a new form with the specified action and method.
func NewForm(action, method string) *Form {
	return &Form{
		Action: action,
		Method: method,
		Fields: make(map[string]*Field),
	}
}

// SetErrors sets error messages on a form, based on the validation
// errors in the underlying object/model.
func (form *Form) SetErrors(errors map[string]string) {
	for fieldName, errorMessage := range errors {
		field := form.Fields[fieldName]
		if field != nil {
			field.Error = errorMessage
			field.CssClasses += " is-invalid "
		}
	}
}

// SortedTagFields returns tag fields in sorted display order.
func (form *Form) SortedTagFields() []*Field {
	tagFields := make([]*Field, 0)
	for _, f := range form.Fields {
		if _, ok := f.Attrs["data-tag-field-order"]; ok {
			tagFields = append(tagFields, f)
		}
	}
	sort.Sort(TagFields(tagFields))
	return tagFields
}

type Choice struct {
	Value string
	Label string
}

// Field contains the barebones info our templates need to render
// a form field. Keep the display stuff in the template, not in
// the code.
type Field struct {
	// Id is the id of the HTML element.
	Id string
	// Label is the lable to display on the form.
	Label string
	// Name is the name attribute of the form element.
	Name string
	// Value is the value of the form element.
	Value string
	// Choices is a list of choices for HTML select or radio group.
	Choices []Choice
	// CssClasses is a string of css classes to apply to the form input.
	CssClasses string
	// Error is an error message for this field.
	Error string
	// Help displays some help text beneath the field.
	Help string
	// Attrs is a map of name-value attribute pairs to be added to the
	// input's HTML.
	Attrs map[string]string
}

// NewField creates a new form field.
func NewField(id, name, label, value string) *Field {
	return &Field{
		Id:      id,
		Name:    name,
		Label:   label,
		Value:   value,
		Choices: make([]Choice, 0),
		Attrs:   make(map[string]string),
	}
}

// getNamePart returns part of a structured field name.
// Field names for default tag values use the format
// "defaultTagId|tagname|relFilePath"
func (field *Field) getNamePart(index int) string {
	part := ""
	parts := strings.Split(field.Name, ":")
	if len(parts) == 3 {
		part = parts[index]
	}
	return part
}

func (field *Field) RelativeFilePath() string {
	return field.getNamePart(2)
}

func (field *Field) TagName() string {
	return field.getNamePart(1)
}

func (field *Field) TagId() string {
	return field.getNamePart(0)
}

// TagFields implements an interface for sorting.
type TagFields []*Field

func (tf TagFields) Len() int {
	return len(tf)
}
func (tf TagFields) Swap(i, j int) {
	tf[i], tf[j] = tf[j], tf[i]
}
func (tf TagFields) Less(i, j int) bool {
	order_i, _ := strconv.Atoi(tf[i].Attrs["data-tag-field-order"])
	order_j, _ := strconv.Atoi(tf[j].Attrs["data-tag-field-order"])
	return order_i < order_j
}
