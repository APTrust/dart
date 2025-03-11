package controllers_test

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/APTrust/dart-runner/core"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAppSettingsList(t *testing.T) {
	defer core.ClearDartTable()
	s1 := core.NewAppSetting("Setting 1", "Value 1")
	s2 := core.NewAppSetting("Setting 2", "Value 2")
	assert.NoError(t, core.ObjSave(s1))
	assert.NoError(t, core.ObjSave(s2))

	expected := []string{
		"Application Settings",
		"Name",
		"Value",
		"New",
		"Setting 1",
		"Value 1",
		"Setting 2",
		"Value 2",
	}

	DoSimpleGetTest(t, "/app_settings", expected)
}

func TestAppSettingNew(t *testing.T) {
	expected := []string{
		"Application Setting",
		"AppSetting_Name",
		"AppSetting_Value",
		`name="Name"`,
		`name="Value"`,
	}

	DoSimpleGetTest(t, "/app_settings/new", expected)
}

func TestAppSettingSaveEditDelete(t *testing.T) {
	defer core.ClearDartTable()
	testNewWithMisingParams(t)
	testNewSaveEditDeleteWithGoodParams(t)
}

func testNewWithMisingParams(t *testing.T) {
	expectedContent := []string{
		"NameError",
		"Name cannot be empty",
		"ValueError",
		"Value cannot be empty",
	}

	w := httptest.NewRecorder()
	req, err := NewPostRequest("/app_settings/new", url.Values{})
	require.Nil(t, err)
	dartServer.ServeHTTP(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
	html := w.Body.String()
	ok, notFound := AssertContainsAllStrings(html, expectedContent)
	assert.True(t, ok, "Missing from page: %v", notFound)
}

func testNewSaveEditDeleteWithGoodParams(t *testing.T) {
	expectedContent := []string{
		"Application Settings",
		"Web Test Name 1",
		"Web Test Value 1",
	}

	params := url.Values{}
	params.Set("ID", uuid.NewString())
	params.Set("Name", "Web Test Name 1")
	params.Set("Value", "Web Test Value 1")
	params.Set("UserCanDelete", "true")

	// Submit the New App Setting form with valid params.
	settings := PostTestSettings{
		EndpointUrl:              "/app_settings/new",
		Params:                   params,
		ExpectedResponseCode:     http.StatusFound,
		ExpectedRedirectLocation: "/app_settings",
	}
	DoSimplePostTest(t, settings)

	// Make sure it was created
	id := params.Get("ID")
	itemUrl := fmt.Sprintf("/app_settings/edit/%s", id)
	DoSimpleGetTest(t, itemUrl, expectedContent)

	// This will also tell us it was created
	queryResult := core.ObjFind(id)
	assert.Nil(t, queryResult.Error)
	assert.NotNil(t, queryResult.AppSetting())

	// Submit the Edit App Setting form with updated params.
	params.Set("Name", "Web Test Name Edited")
	params.Set("Value", "Web Test Value Edited")
	itemUrl = fmt.Sprintf("/app_settings/edit/%s", id)
	settings = PostTestSettings{
		EndpointUrl:              itemUrl,
		Params:                   params,
		ExpectedResponseCode:     http.StatusFound,
		ExpectedRedirectLocation: "/app_settings",
	}
	DoSimplePostTest(t, settings)

	// Make sure it was updated
	expectedContent[1] = "Web Test Name Edited"
	expectedContent[2] = "Web Test Value Edited"
	itemUrl = fmt.Sprintf("/app_settings/edit/%s", id)
	DoSimpleGetTest(t, itemUrl, expectedContent)

	// Test App Setting Delete
	itemUrl = fmt.Sprintf("/app_settings/delete/%s", id)
	settings = PostTestSettings{
		EndpointUrl:              itemUrl,
		Params:                   url.Values{},
		ExpectedResponseCode:     http.StatusFound,
		ExpectedRedirectLocation: "/app_settings",
	}
	DoSimplePostTest(t, settings)

	// Make sure the item really was deleted
	queryResult = core.ObjFind(id)
	assert.Error(t, queryResult.Error)
}
