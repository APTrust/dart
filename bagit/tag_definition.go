package bagit

import (
	"github.com/APTrust/easy-store/errtypes"
	"github.com/APTrust/easy-store/util"
	"github.com/satori/go.uuid"
	"strings"
)

type TagDefinition struct {
	Id           string   `json:"id"`
	TagFile      string   `json:"tagFile"`
	TagName      string   `json:"tagName"`
	Required     bool     `json:"required"`
	EmptyOk      bool     `json:"emptyOk"`
	Values       []string `json:"values"`
	DefaultValue string   `json:"defaultValue"`
	UserValue    string   `json:"userValue"`
	Help         string   `json:"help"`
	IsBuiltIn    bool     `json:"isBuiltIn"`

	// AddedForJob is true if the tag definition is not part
	// of the base BagIt profile, but was added by the user
	// later (usually through the Easy Store UI) as a special
	// one-off tag specific to one bag.
	AddedForJob bool `json:"addedForJob"`
}

func NewTagDefinition(tagFile, tagName string) *TagDefinition {
	_uuid, _ := uuid.NewV4()
	return &TagDefinition{
		Id:           _uuid.String(),
		TagFile:      tagFile,
		TagName:      tagName,
		Required:     true,
		EmptyOk:      false,
		Values:       make([]string, 0),
		DefaultValue: "",
		UserValue:    "",
		IsBuiltIn:    false,
	}
}

// ValueIsAllowed returns true if 1) the value appears in the TagDefinition's
// list of allowed values or 2) the TagDefintion does not contain a list of
// allowed values (hence, any value is allowed). In either case, if param value
// is empty and TagDefinition.EmptyOk is false, this will return false.
func (tagDef *TagDefinition) ValueIsAllowed(value string) (err error) {
	if !tagDef.EmptyOk && value == "" {
		err = errtypes.NewEmptyError("Value for tag %s cannot be empty", tagDef.TagName)
	} else if tagDef.Values != nil && len(tagDef.Values) > 0 {
		if !util.StringListContains(tagDef.Values, value) {
			err = errtypes.NewValueError("Value '%s' for tag '%s' is not in "+
				"list of allowed values (%s)", value, tagDef.TagName,
				strings.Join(tagDef.Values, ", "))
		}
	}
	return err
}

func (tagDef *TagDefinition) Validate() error {
	return tagDef.ValueIsAllowed(tagDef.UserValue)
}
