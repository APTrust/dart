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
	field := models.NewField("id", "name", "label", "value")
	require.NotNil(t, field)
	assert.Equal(t, "id", field.Id)
	assert.Equal(t, "name", field.Name)
	assert.Equal(t, "label", field.Label)
	assert.Equal(t, "value", field.Value)
	assert.NotNil(t, field.Choices)
	assert.Empty(t, field.Choices)
	assert.NotNil(t, field.Attrs)
	assert.Empty(t, field.Attrs)
}

func TestFieldRelativeFilePath(t *testing.T) {
	name := "13:Friday-The:dpn-tags/dpn-info.txt"
	field := models.NewField("id", name, "label", "value")
	assert.Equal(t, "dpn-tags/dpn-info.txt", field.RelativeFilePath())

	// Should get empty string, not panic.
	field.Name = "not-a-tag-field"
	assert.Empty(t, field.RelativeFilePath())
}

func TestFieldTagName(t *testing.T) {
	name := "13:Friday-The:dpn-tags/dpn-info.txt"
	field := models.NewField("id", name, "label", "value")
	assert.Equal(t, "Friday-The", field.TagName())

	// Should get empty string, not panic.
	field.Name = "not-a-tag-field"
	assert.Empty(t, field.TagName())

}

func TestFieldTagId(t *testing.T) {
	name := "13:Friday-The:dpn-tags/dpn-info.txt"
	field := models.NewField("id", name, "label", "value")
	assert.Equal(t, "13", field.TagId())

	// Should get empty string, not panic.
	field.Name = "not-a-tag-field"
	assert.Empty(t, field.TagId())
}

func TestTagFieldsLen(t *testing.T) {
	form := makeForm()
	require.NotNil(t, form)
	tagFields := form.SortedTagFields()
	assert.Equal(t, 5, tagFields.Len())
}

func TestTagFieldsSwap(t *testing.T) {
	form := makeForm()
	require.NotNil(t, form)
	tagFields := form.SortedTagFields()

	previousName3 := tagFields[3].Name
	previousName4 := tagFields[4].Name
	tagFields.Swap(3, 4)
	assert.Equal(t, previousName4, tagFields[3].Name)
	assert.Equal(t, previousName3, tagFields[4].Name)
}

func TestTagFieldsLess(t *testing.T) {
	form := makeForm()
	require.NotNil(t, form)
	tagFields := form.SortedTagFields()
	assert.True(t, tagFields.Less(1, 2))
	assert.False(t, tagFields.Less(4, 3))
}

func TestTagFieldsRelFilePathChanged(t *testing.T) {
	form := makeForm()
	require.NotNil(t, form)
	tagFields := form.SortedTagFields()
	assert.True(t, tagFields.RelFilePathChanged(0))
	assert.False(t, tagFields.RelFilePathChanged(1))
	assert.False(t, tagFields.RelFilePathChanged(2))
	assert.False(t, tagFields.RelFilePathChanged(3))
	assert.False(t, tagFields.RelFilePathChanged(4))

	tagFields[2].Name = "88:tag-name:file-name"

	// 2 is different from 1 and 3 is different from 2
	assert.True(t, tagFields.RelFilePathChanged(2))
	assert.True(t, tagFields.RelFilePathChanged(3))
}
