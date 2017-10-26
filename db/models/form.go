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

// Field contains the barebones info our templates need to render
// a form field. Keep the display stuff in the template, not in
// the code.
type Field struct {
	Id      string
	Name    string
	Value   string
	Options map[string]string
}

// NewField creates a new form field.
func NewField(id, name, value string, options map[string]string) *Field {
	if options == nil {
		options = make(map[string]string)
	}
	return &Field{
		Id:      id,
		Name:    name,
		Value:   value,
		Options: options,
	}
}
