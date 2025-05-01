package controllers_test

import (
	"fmt"
	"net/http"
	"net/url"
	"testing"

	"github.com/APTrust/dart-runner/core"
	"github.com/APTrust/dart/v3/server/controllers"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestJobShowMetadata(t *testing.T) {
	defer core.ClearDartTable()
	job := loadTestJob(t)
	assert.NoError(t, core.ObjSave(job))

	expected := []string{}
	for _, tag := range job.BagItProfile.Tags {
		expected = append(expected, tag.TagName, tag.GetValue())
	}

	DoSimpleGetTest(t, fmt.Sprintf("/jobs/metadata/%s", job.ID), expected)
}

func TestJobSaveMetadata(t *testing.T) {
	defer core.ClearDartTable()
	job := loadTestJob(t)
	assert.NoError(t, core.ObjSave(job))

	tagsToSet := map[string]string{
		"aptrust-info.txt/Title":           "This is the new title",
		"aptrust-info.txt/Description":     "This is the new description",
		"bag-info.txt/Source-Organization": "The Krusty Krab",
	}

	// Emulate "Next" button click.
	params := url.Values{}
	params.Add("direction", "next")

	for key, value := range tagsToSet {
		params.Add(key, value)
	}

	postTestSettings := PostTestSettings{
		EndpointUrl:              fmt.Sprintf("/jobs/metadata/%s", job.ID),
		Params:                   params,
		ExpectedResponseCode:     http.StatusFound,
		ExpectedRedirectLocation: fmt.Sprintf("/jobs/upload/%s", job.ID),
	}
	DoSimplePostTest(t, postTestSettings)

	// Emulate "Previous" button click.
	params.Set("direction", "previous")
	postTestSettings.ExpectedRedirectLocation = fmt.Sprintf("/jobs/packaging/%s", job.ID)
	DoSimplePostTest(t, postTestSettings)

	// Make sure settings were saved.
	result := core.ObjFind(job.ID)
	require.Nil(t, result.Error)
	job = result.Job()

	for key, value := range tagsToSet {
		tag := job.BagItProfile.GetTagByFullyQualifiedName(key)
		require.NotNil(t, tag, key)
		assert.Equal(t, value, tag.GetValue(), tag.FullyQualifiedName())
	}
}

func TestJobAddTag(t *testing.T) {
	defer core.ClearDartTable()
	job := loadTestJob(t)
	assert.NoError(t, core.ObjSave(job))

	expected := []string{
		`id="TagDefinition_TagFile"`,
		`id="TagDefinition_TagName"`,
		`id="TagDefinition_UserValue"`,
		`id="TagDefinition_ID"`,
	}

	jobUrl := fmt.Sprintf("/jobs/add_tag/%s", job.ID)
	DoSimpleGetTest(t, jobUrl, expected)
}

func TestJobSaveAndDeleteTag(t *testing.T) {
	defer core.ClearDartTable()
	job := loadTestJob(t)
	assert.NoError(t, core.ObjSave(job))

	newTagID := uuid.NewString()
	newTagValue := "1234-5678"

	expected := []string{
		newTagID,
		newTagValue,
		"custom.txt",
	}

	params := url.Values{}
	params.Add("ID", newTagID)
	params.Add("TagFile", "custom.txt")
	params.Add("TagName", "Test-Tag")
	params.Add("IsBuiltIn", "false")
	params.Add("IsUserAddedTag", "true")
	params.Add("WasAddedForJob", "true")
	params.Add("UserValue", newTagValue)

	postTestSettings := PostTestSettings{
		EndpointUrl:          fmt.Sprintf("/jobs/add_tag/%s", job.ID),
		Params:               params,
		ExpectedResponseCode: http.StatusOK,
	}
	DoSimplePostTest(t, postTestSettings)

	// Now reload the job metadata page and make sure
	// our new tag is there.
	jobMetadataUrl := fmt.Sprintf("/jobs/metadata/%s", job.ID)
	DoSimpleGetTest(t, jobMetadataUrl, expected)

	// Now let's delete that new tag.
	params = url.Values{}
	params.Set("tagId", newTagID)
	postTestSettings = PostTestSettings{
		EndpointUrl:          fmt.Sprintf("/jobs/delete_tag/%s", job.ID),
		Params:               params,
		ExpectedResponseCode: http.StatusOK,
	}
	DoSimplePostTest(t, postTestSettings)

	// Make sure the tag was deleted
	html := GetUrl(t, jobMetadataUrl)
	for _, str := range expected {
		assert.NotContains(t, html, str, str)
	}
}

func TestShouldHideTag(t *testing.T) {
	tagDef := &core.TagDefinition{
		TagFile:      "aptrust-info.txt",
		TagName:      "Storage-Option",
		DefaultValue: "Standard",
	}
	// Should not hide, because aptrust-info.txt/Storage-Option
	// is an exception.
	assert.False(t, controllers.ShouldHideTag(tagDef))

	// Should hide because tag has a default value.
	tagDef.TagName = "Some-Other-Tag"
	assert.True(t, controllers.ShouldHideTag(tagDef))

	// Should not hide because no default value.
	tagDef.DefaultValue = ""
	assert.False(t, controllers.ShouldHideTag(tagDef))

	// Should hide because system must set this value.
	tagDef.TagFile = "bag-info.txt"
	tagDef.TagName = "Payload-Oxum"
	assert.True(t, controllers.ShouldHideTag(tagDef))

	// Default should be false (do not hide)
	assert.False(t, controllers.ShouldHideTag(&core.TagDefinition{}))
}
