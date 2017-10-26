package models

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
	// Name is the name attribute of the form element.
	Name string
	// Value is the value of the form element.
	Value string
	// Choices is a list of choices for HTML select or radio group.
	Choices []Choice
	// CssClasses is a string of css classes to apply to the form input.
	CssClasses string
	// Required indicates whether the element is required.
	Required bool
	// Attrs is a map of name-value attribute pairs to be added to the
	// input's HTML.
	Attrs map[string]string
}

// NewField creates a new form field.
func NewField(id, name, value string) *Field {
	return &Field{
		Id:      id,
		Name:    name,
		Value:   value,
		Choices: make([]Choice, 0),
		Attrs:   make(map[string]string),
	}
}
