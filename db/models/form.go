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
// errors in the underlying object/model. In the errors map, the key
// is the name of the field, and the value is the error message for
// that specific field. This function tags each field with its specific
// error, so the HTML form can display them.
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
func (form *Form) SortedTagFields() TagFields {
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

// RelativeFilePath returns the tag file name of the DefaultTagValue
// represented by an HTML input. The path is parsed from the input name.
// This will return an empty string if the field name does
// not follow the naming convention for DefaultTagValue fields.
func (field *Field) RelativeFilePath() string {
	return field.getNamePart(2)
}

// TagName returns the name of the DefaultTagValue represented
// by an HTML input. The TagName is parsed from the input name.
// This will return an empty string if the field name does
// not follow the naming convention for DefaultTagValue fields.
func (field *Field) TagName() string {
	return field.getNamePart(1)
}

// TagId returns the id of the DefaultTagValue represented
// by an HTML input. The TagId is parsed from the input name.
// This will return an empty string if the field name does
// not follow the naming convention for DefaultTagValue fields.
func (field *Field) TagId() string {
	return field.getNamePart(0)
}

// TagFields implements an interface for sorting.
type TagFields []*Field

// Len returns the length of the TagFields slice.
// This is part of the sorting interface.
func (tf TagFields) Len() int {
	return len(tf)
}

// Swap swaps the order of items at indexes i and j.
// This is part of the sorting interface.
func (tf TagFields) Swap(i, j int) {
	tf[i], tf[j] = tf[j], tf[i]
}

// Less returns true if the item at index i should be
// considered less than the item at index j.
// This is part of the sorting interface.
func (tf TagFields) Less(i, j int) bool {
	order_i, _ := strconv.Atoi(tf[i].Attrs["data-tag-field-order"])
	order_j, _ := strconv.Atoi(tf[j].Attrs["data-tag-field-order"])
	return order_i < order_j
}

// RelFilePathChanged returns true if the RelativeFilePath of
// this tag field differs from the RelativeFilePath of the previous field.
// The bagit_profile_form.html template uses this to figure out when
// to output a new fieldset.
func (tf TagFields) RelFilePathChanged(index int) bool {
	return index == 0 || (index < len(tf) && (tf[index].RelativeFilePath() != tf[index-1].RelativeFilePath()))
}
