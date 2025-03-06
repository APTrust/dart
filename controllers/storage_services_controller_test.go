package controllers_test

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strconv"
	"testing"

	"github.com/APTrust/dart-runner/constants"
	"github.com/APTrust/dart-runner/core"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func getFakeService(name, host string) *core.StorageService {
	ss := core.NewStorageService()
	ss.Name = name
	ss.Host = host

	ss.AllowsUpload = true
	ss.AllowsDownload = true
	ss.Bucket = "yarg"
	ss.Description = "the krusty krab"
	ss.Login = "spongebob"
	ss.LoginExtra = "login-xtra"
	ss.Password = "patrick star"
	ss.Port = 8080
	ss.Protocol = constants.ProtocolSFTP
	return ss
}

func TestStorageServicesList(t *testing.T) {
	defer core.ClearDartTable()
	ss1 := getFakeService("Service One", "service-one.example.com")
	ss2 := getFakeService("Service Two", "service-two.example.com")
	assert.NoError(t, core.ObjSave(ss1))
	assert.NoError(t, core.ObjSave(ss2))

	expected := []string{
		"Storage Services",
		"Name",
		"Description",
		"Protocol",
		"Host",
		"New",
		ss1.ID,
		ss1.Name,
		ss1.Description,
		ss1.Protocol,
		ss1.Host,
		ss2.ID,
		ss2.Name,
		ss2.Description,
		ss2.Protocol,
		ss2.Host,
	}

	DoSimpleGetTest(t, "/storage_services", expected)
}

func TestStorageServiceNew(t *testing.T) {
	expected := []string{
		"StorageService_Name",
		"StorageService_Description",
		"StorageService_Protocol",
		"StorageService_Host",
		`name="Name"`,
		`name="Host"`,
		`name="Port"`,
		`name="Bucket"`,
		`name="Login"`,
		`name="Password"`,
	}

	DoSimpleGetTest(t, "/storage_services/new", expected)
}

func TestStorageServiceSaveEditDelete(t *testing.T) {
	defer core.ClearDartTable()
	testSSNewWithMisingParams(t)
	testSSNewSaveEditDeleteWithGoodParams(t)
}

func testSSNewWithMisingParams(t *testing.T) {
	expectedContent := []string{
		"StorageService requires a name",
		"StorageService requires a protocol",
		"StorageService requires a hostname or IP address",
		"StorageService requires a login name or access key id",
		"StorageService requires a password or secret access key",
	}

	w := httptest.NewRecorder()
	req, err := NewPostRequest("/storage_services/new", url.Values{})
	require.Nil(t, err)
	dartServer.ServeHTTP(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
	html := w.Body.String()
	ok, notFound := AssertContainsAllStrings(html, expectedContent)
	assert.True(t, ok, "Missing from page: %v", notFound)

	// For S3 protocol, make sure we tell the user that
	// we require a bucket name.
	expectedContent = []string{"StorageService requires a bucket name when the protocol is S3."}
	req, err = NewPostRequest("/storage_services/new", url.Values{"Protocol": []string{"s3"}})
	require.Nil(t, err)
	dartServer.ServeHTTP(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
	html = w.Body.String()
	ok, notFound = AssertContainsAllStrings(html, expectedContent)
	assert.True(t, ok, "Missing from page: %v", notFound)

}

func testSSNewSaveEditDeleteWithGoodParams(t *testing.T) {
	ss := getFakeService("Web Test Storage Service", "web-test-ss.example.com")
	expectedContent := []string{
		ss.ID,
		ss.Name,
		ss.Host,
	}

	params := url.Values{}
	params.Set("ID", ss.ID)
	params.Set("Name", ss.Name)
	params.Set("Host", ss.Host)
	params.Set("Protocol", ss.Protocol)
	params.Set("Bucket", ss.Bucket)
	params.Set("Login", ss.Login)
	params.Set("Password", ss.Password)
	//params.Set("UserCanDelete", "true")

	// Submit the New App Setting form with valid params.
	settings := PostTestSettings{
		EndpointUrl:              "/storage_services/new",
		Params:                   params,
		ExpectedResponseCode:     http.StatusFound,
		ExpectedRedirectLocation: "/storage_services",
	}
	DoSimplePostTest(t, settings)

	// Make sure it was created
	id := params.Get("ID")
	itemUrl := fmt.Sprintf("/storage_services/edit/%s", id)
	DoSimpleGetTest(t, itemUrl, expectedContent)

	// This will also tell us it was created
	queryResult := core.ObjFind(id)
	assert.Nil(t, queryResult.Error)
	assert.NotNil(t, queryResult.StorageService())

	// Submit the Edit App Setting form with updated params.
	params.Set("Name", ss.Name+" Edited")
	params.Set("Host", ss.Host+"/edited")
	itemUrl = fmt.Sprintf("/storage_services/edit/%s", id)
	settings = PostTestSettings{
		EndpointUrl:              itemUrl,
		Params:                   params,
		ExpectedResponseCode:     http.StatusFound,
		ExpectedRedirectLocation: "/storage_services",
	}
	DoSimplePostTest(t, settings)

	// Make sure it was updated
	expectedContent[1] = ss.Name + " Edited"
	expectedContent[2] = ss.Host + "/edited"
	itemUrl = fmt.Sprintf("/storage_services/edit/%s", id)
	DoSimpleGetTest(t, itemUrl, expectedContent)

	// Test App Setting Delete
	itemUrl = fmt.Sprintf("/storage_services/delete/%s", id)
	settings = PostTestSettings{
		EndpointUrl:              itemUrl,
		Params:                   url.Values{},
		ExpectedResponseCode:     http.StatusFound,
		ExpectedRedirectLocation: "/storage_services",
	}
	DoSimplePostTest(t, settings)

	// Make sure the item really was deleted
	queryResult = core.ObjFind(id)
	assert.Error(t, queryResult.Error)
}

// This test should be run from ./scripts/test.rb, so we know
// the local minio test service is running. Otherwise, you'll
// have to start the service manually.
func TestStorageServiceConnection(t *testing.T) {
	defer core.ClearDartTable()
	ss, err := core.LoadStorageServiceFixture("storage_service_local_minio.json")
	require.NoError(t, err)

	//assert.NoError(t, core.ObjSave(ss))

	expected := []string{
		ss.Name,
		"succeeded",
	}

	params := url.Values{}
	params.Set("ID", ss.ID)
	params.Set("Name", ss.Name)
	params.Set("Host", ss.Host)
	params.Set("Protocol", ss.Protocol)
	params.Set("Port", strconv.Itoa(ss.Port))
	params.Set("Bucket", ss.Bucket)
	params.Set("Login", ss.Login)
	params.Set("Password", ss.Password)

	settings := PostTestSettings{
		EndpointUrl:          fmt.Sprintf("/storage_services/test/%s", ss.ID),
		Params:               params,
		ExpectedResponseCode: http.StatusOK,
		ExpectedContent:      expected,
	}
	DoSimplePostTest(t, settings)

}
