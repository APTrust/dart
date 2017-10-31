package models_test

import (
	"fmt"
	"github.com/APTrust/easy-store/db/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"math"
	"net/http"
	"strconv"
	"testing"
)

const TEST_ACTION = "/example/1/edit"

func makeForm() *models.Form {
	form := models.NewForm(TEST_ACTION, http.MethodPost)
	for i := 0; i < 5; i++ {
		id := fmt.Sprintf("id_%d", i)
		name := fmt.Sprintf("name_%d", i)
		label := fmt.Sprintf("label_%d", i)
		value := fmt.Sprintf("value_%d", i)
		field := models.NewField(id, name, label, value)

		choices := make([]string, 5)
		for j := 0; j < 5; j++ {
			attrName := fmt.Sprintf("attrName_%d", j)
			attrValue := fmt.Sprintf("attrValue_%d", j)
			field.Attrs[attrName] = attrValue
			choices[j] = fmt.Sprintf("value_%d", j)
		}
		field.Choices = models.ChoiceList(choices)

		// Set display order to reverse order (4,3,2,1,0)
		displayOrder := int(math.Abs(float64(5 - i)))
		field.Attrs["data-tag-field-order"] = strconv.Itoa(displayOrder)

		form.Fields[field.Name] = field
	}
	return form
}

func TestNewForm(t *testing.T) {
	form := makeForm()
	require.NotNil(t, form)
	require.NotEmpty(t, form.Fields)
	for _, field := range form.Fields {
		assert.NotEmpty(t, field.Id)
		assert.NotEmpty(t, field.Name)
		assert.NotEmpty(t, field.Label)
		assert.NotEmpty(t, field.Value)
		assert.NotEmpty(t, field.Choices)
		assert.NotEmpty(t, field.Attrs)
	}
}

func TestFormSetErrors(t *testing.T) {
	form := makeForm()
	require.NotNil(t, form)

	errors := make(map[string]string)
	errors["name_1"] = "Error for field 1"
	errors["name_2"] = "Error for field 2"
	form.SetErrors(errors)

	field1 := form.Fields["name_1"]
	assert.Equal(t, "Error for field 1", field1.Error)

	field2 := form.Fields["name_2"]
	assert.Equal(t, "Error for field 2", field2.Error)

	field3 := form.Fields["name_3"]
	assert.Empty(t, field3.Error)
}

func TestFormSortedTagFields(t *testing.T) {
	form := makeForm()
	require.NotNil(t, form)
	tagFields := form.SortedTagFields()
	require.NotEmpty(t, tagFields)
	// Should be sorted by "data-tag-field-order",
	// which is reverse of name order.
	assert.Equal(t, "name_4", tagFields[0].Name)
	assert.Equal(t, "name_3", tagFields[1].Name)
	assert.Equal(t, "name_2", tagFields[2].Name)
	assert.Equal(t, "name_1", tagFields[3].Name)
	assert.Equal(t, "name_0", tagFields[4].Name)
}

func TestNewField(t *testing.T) {

}

func TestFieldRelativeFilePath(t *testing.T) {

}

func TestFieldTagName(t *testing.T) {

}

func TestFieldTagId(t *testing.T) {

}

func TestTagFieldsLen(t *testing.T) {

}

func TestTagFieldsSwap(t *testing.T) {

}

func TestTagFieldsLess(t *testing.T) {

}

func TestTagFieldsRelFilePathChanged(t *testing.T) {

}
