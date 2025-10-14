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

func TestRemoteRepositiriesList(t *testing.T) {
	defer core.ClearDartTable()
	rr1 := core.NewRemoteRepository()
	rr1.Name = "RR-1"
	rr1.Url = "https://example.com/rr-1"
	rr2 := core.NewRemoteRepository()
	rr2.Name = "RR-2"
	rr2.Url = "https://example.com/rr-2"
	assert.Nil(t, core.ObjSave(rr1))
	assert.Nil(t, core.ObjSave(rr2))

	expected := []string{
		"Remote Repositories",
		"Name",
		"URL",
		"New",
		rr1.Name,
		rr1.Url,
		rr2.Name,
		rr2.Url,
	}

	DoSimpleGetTest(t, "/remote_repositories", expected)
}

func TestRemoteRepositoryNew(t *testing.T) {
	expected := []string{
		"Remote Repository",
		"RemoteRepository_Name",
		"RemoteRepository_Url",
		"RemoteRepository_User",
		"RemoteRepository_APIToken",
		`name="Name"`,
		`name="UserID"`,
		`name="Url"`,
		`name="APIToken"`,
	}

	DoSimpleGetTest(t, "/remote_repositories/new", expected)
}

func TestRemoteRepoSaveEditDelete(t *testing.T) {
	defer core.ClearDartTable()
	testNewRepoWithMisingParams(t)
	testRepoNewSaveEditDeleteWithGoodParams(t)
}

func testNewRepoWithMisingParams(t *testing.T) {
	expectedContent := []string{
		"NameError",
		"Please enter a name.",
		"UrlError",
		"Repository URL must be a valid URL beginning with http:// or https://.",
	}

	w := httptest.NewRecorder()
	req, err := NewPostRequest("/remote_repositories/new", url.Values{})
	require.Nil(t, err)
	dartServer.ServeHTTP(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
	html := w.Body.String()
	ok, notFound := AssertContainsAllStrings(html, expectedContent)
	assert.True(t, ok, "Missing from page: %v", notFound)
}

func testRepoNewSaveEditDeleteWithGoodParams(t *testing.T) {
	expectedContent := []string{
		"Application Settings",
		"Web Test Repo 1",
		"https://test-repo-1.example.com",
	}

	params := url.Values{}
	params.Set("ID", uuid.NewString())
	params.Set("Name", "Web Test Repo 1")
	params.Set("Url", "https://test-repo-1.example.com")
	params.Set("UserCanDelete", "true")

	// Submit the New App Setting form with valid params.
	settings := PostTestSettings{
		EndpointUrl:              "/remote_repositories/new",
		Params:                   params,
		ExpectedResponseCode:     http.StatusFound,
		ExpectedRedirectLocation: "/remote_repositories",
	}
	DoSimplePostTest(t, settings)

	// Make sure it was created
	id := params.Get("ID")
	itemUrl := fmt.Sprintf("/remote_repositories/edit/%s", id)
	DoSimpleGetTest(t, itemUrl, expectedContent)

	// This will also tell us it was created
	queryResult := core.ObjFind(id)
	assert.Nil(t, queryResult.Error)
	assert.NotNil(t, queryResult.RemoteRepository())

	// Submit the Edit App Setting form with updated params.
	params.Set("Name", "Web Test Repo Edited")
	params.Set("Url", "https://test-repo-1.example.com/edited")
	itemUrl = fmt.Sprintf("/remote_repositories/edit/%s", id)
	settings = PostTestSettings{
		EndpointUrl:              itemUrl,
		Params:                   params,
		ExpectedResponseCode:     http.StatusFound,
		ExpectedRedirectLocation: "/remote_repositories",
	}
	DoSimplePostTest(t, settings)

	// Make sure it was updated
	expectedContent[1] = "Web Test Repo Edited"
	expectedContent[2] = "https://test-repo-1.example.com/edited"
	itemUrl = fmt.Sprintf("/remote_repositories/edit/%s", id)
	DoSimpleGetTest(t, itemUrl, expectedContent)

	// Test App Setting Delete
	itemUrl = fmt.Sprintf("/remote_repositories/delete/%s", id)
	settings = PostTestSettings{
		EndpointUrl:              itemUrl,
		Params:                   url.Values{},
		ExpectedResponseCode:     http.StatusFound,
		ExpectedRedirectLocation: "/remote_repositories",
	}
	DoSimplePostTest(t, settings)

	// Make sure the item really was deleted
	queryResult = core.ObjFind(id)
	assert.Error(t, queryResult.Error)
}
