package bagit

import (
	"github.com/APTrust/easy-store/errtypes"
	"github.com/APTrust/easy-store/util"
	"strings"
)

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

// ValueIsAllowed returns true if 1) the value appears in the TagDefinition's
// list of allowed values or 2) the TagDefintion does not contain a list of
// allowed values (hence, any value is allowed). In either case, if param value
// is empty and TagDefinition.EmptyOk is false, this will return false.
func (tagDef *TagDefinition) ValueIsAllowed(value string) (err error) {
	if !tagDef.EmptyOk && value == "" {
		err = errtypes.NewEmptyError("Value for tag %s cannot be empty", tagDef.Label)
	} else if tagDef.Values != nil && len(tagDef.Values) > 0 {
		if !util.StringListContains(tagDef.Values, value) {
			err = errtypes.NewValueError("Value '%s' for tag '%s' is not in "+
				"list of allowed values (%s)", value, tagDef.Label,
				strings.Join(tagDef.Values, ", "))
		}
	}
	return err
}
