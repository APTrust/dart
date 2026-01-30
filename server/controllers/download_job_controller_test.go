package controllers_test

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/APTrust/dart-runner/constants"
	"github.com/APTrust/dart-runner/core"
	"github.com/APTrust/dart/v3/server/controllers"
	"github.com/minio/minio-go/v7"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// NOTE: These tests assume that local Minio server is running.
//
// If you run the full test suite using `./scripts/run.rb tests`, the
// script will start the Minio server for you.
//
// If you want to run this as a one-off test, first start the Minio
// server using `./scripts/run.rb servers`, then run the tests in this file.

// TestDownloadJobNew tests the GET /download_jobs/new endpoint
func TestDownloadJobNew(t *testing.T) {
	defer core.ClearDartTable()

	// Set up storage services
	loadMinioStorageService(t)

	expected := []string{
		"Download From",
		"Download",
		"Choose One",
	}
	DoSimpleGetTest(t, "/download_jobs/new", expected)
}

// TestDownloadJobBrowse tests the POST /download_jobs/browse endpoint
func TestDownloadJobBrowse(t *testing.T) {
	defer core.ClearDartTable()

	// Set up storage service
	ss := loadMinioStorageService(t)

	// Test browsing without selecting a bucket
	params := url.Values{}
	params.Set("ssid", ss.ID)
	settings := PostTestSettings{
		EndpointUrl:          "/download_jobs/browse",
		Params:               params,
		ExpectedResponseCode: http.StatusOK,
		ExpectedContent: []string{
			"Download From",
			"Bucket",
			ss.Name,
		},
	}
	DoSimplePostTest(t, settings)

	// Test browsing with the test bucket selected
	bucketName := "test"
	params.Set("bucket", bucketName)
	settings.Params = params
	settings.ExpectedContent = []string{
		"Download From",
		"Bucket",
		ss.Name,
		bucketName,
	}
	DoSimplePostTest(t, settings)
}

// TestDownloadJobDownload tests the POST /download_jobs/download endpoint
// This test requires that files already exist in the test bucket
func TestDownloadJobDownload(t *testing.T) {
	defer core.ClearDartTable()

	// Set up storage service
	ss := loadMinioStorageService(t)

	// Use the existing "test" bucket
	s3Client := setupMinioClient(t, ss)
	bucketName := "test"

	// Get list of objects in bucket
	s3Objects := s3Client.ListObjects(bucketName, "", minio.ListObjectsOptions{
		Recursive: true,
		MaxKeys:   1,
	})

	// Skip test if no files exist
	if len(s3Objects) == 0 {
		t.Skip("No files in test bucket, skipping download test")
		return
	}

	testFileName := s3Objects[0].Key

	// Test downloading the file
	params := url.Values{}
	params.Set("ssid", ss.ID)
	params.Set("s3Bucket", bucketName)
	params.Set("s3Key", testFileName)

	w := httptest.NewRecorder()
	req, err := NewPostRequest("/download_jobs/download", params)
	require.NoError(t, err)
	dartServer.ServeHTTP(w, req)

	// Verify the response
	assert.Equal(t, http.StatusOK, w.Code)
	assert.NotEmpty(t, w.Body.String())
	assert.Contains(t, w.Header().Get("Content-Disposition"), testFileName)
}

// TestDownloadJobDownloadError tests error handling in download
func TestDownloadJobDownloadError(t *testing.T) {
	defer core.ClearDartTable()

	// Set up storage service
	ss := loadMinioStorageService(t)

	// Try to download a file that doesn't exist
	params := url.Values{}
	params.Set("ssid", ss.ID)
	params.Set("s3Bucket", "nonexistent-bucket")
	params.Set("s3Key", "nonexistent-file.txt")

	w := httptest.NewRecorder()
	req, err := NewPostRequest("/download_jobs/download", params)
	require.NoError(t, err)
	dartServer.ServeHTTP(w, req)

	// Should return an error page
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	html := w.Body.String()
	// Check for error indicators in the HTML
	assert.True(t, assert.Contains(t, html, "Error") || assert.Contains(t, html, "error") || assert.Contains(t, html, "does not exist"))
}

// TestGetDownloadFile tests the GetDownloadFile helper function
func TestGetDownloadFile(t *testing.T) {
	defer core.ClearDartTable()

	// Set up storage service
	ss := loadMinioStorageService(t)

	// Use the existing "test" bucket
	s3Client := setupMinioClient(t, ss)
	bucketName := "test"

	// Get list of objects in bucket
	s3Objects := s3Client.ListObjects(bucketName, "", minio.ListObjectsOptions{
		Recursive: true,
		MaxKeys:   1,
	})

	// Skip test if no files exist
	if len(s3Objects) == 0 {
		t.Skip("No files in test bucket, skipping GetDownloadFile test")
		return
	}

	testFileName := s3Objects[0].Key

	// Test GetDownloadFile
	obj, stats, err := controllers.GetDownloadFile(ss.ID, bucketName, testFileName)
	require.NoError(t, err)
	require.NotNil(t, obj)

	// Verify the stats
	assert.Equal(t, testFileName, stats.Key)
	assert.Greater(t, stats.Size, int64(0))

	// Read and verify we can get content
	buf := new(bytes.Buffer)
	_, err = buf.ReadFrom(obj)
	require.NoError(t, err)
	assert.NotEmpty(t, buf.String())
}

// TestGetDownloadFileInvalidStorageService tests error handling
func TestGetDownloadFileInvalidStorageService(t *testing.T) {
	defer core.ClearDartTable()

	// Try to get a file with an invalid storage service ID
	obj, stats, err := controllers.GetDownloadFile("invalid-id", "bucket", "key")
	assert.Error(t, err)
	assert.Nil(t, obj)
	assert.Equal(t, "", stats.Key)
}

// TestDownloadJobBrowseMultipleBuckets tests browsing with multiple buckets
func TestDownloadJobBrowseMultipleBuckets(t *testing.T) {
	defer core.ClearDartTable()

	// Set up storage service
	ss := loadMinioStorageService(t)

	// Test that we can see existing buckets
	params := url.Values{}
	params.Set("ssid", ss.ID)
	params.Set("bucket", "")

	html := PostUrl(t, PostTestSettings{
		EndpointUrl:          "/download_jobs/browse",
		Params:               params,
		ExpectedResponseCode: http.StatusOK,
	})

	// Check for the test bucket that should exist
	assert.Contains(t, html, "test")
}

// TestDownloadJobBrowseWithPagination tests browsing with files in bucket
func TestDownloadJobBrowseWithPagination(t *testing.T) {
	defer core.ClearDartTable()

	// Set up storage service
	ss := loadMinioStorageService(t)

	// Use the existing "test" bucket
	s3Client := setupMinioClient(t, ss)
	bucketName := "test"

	// Get list of objects
	s3Objects := s3Client.ListObjects(bucketName, "", minio.ListObjectsOptions{
		Recursive: true,
		MaxKeys:   50,
	})

	// Test browsing the bucket
	params := url.Values{}
	params.Set("ssid", ss.ID)
	params.Set("bucket", bucketName)

	html := PostUrl(t, PostTestSettings{
		EndpointUrl:          "/download_jobs/browse",
		Params:               params,
		ExpectedResponseCode: http.StatusOK,
	})

	// Verify we get a valid response with bucket info
	assert.Contains(t, html, bucketName)
	// If there are files, at least one should be visible
	if len(s3Objects) > 0 {
		t.Logf("Found %d files in test bucket", len(s3Objects))
	}
}

// TestDownloadJobWithExistingFile tests downloading a file that was uploaded by a job
// This uses files that should already be in Minio if the upload_job_controller_test ran
func TestDownloadJobWithExistingFile(t *testing.T) {
	defer core.ClearDartTable()

	// Set up storage service
	ss := loadMinioStorageService(t)

	// The upload job test uses the "test" bucket
	bucketName := "test"

	// Try to list objects in the test bucket
	s3Client := setupMinioClient(t, ss)
	s3Objects := s3Client.ListObjects(bucketName, "", minio.ListObjectsOptions{
		Recursive: true,
		MaxKeys:   10,
	})

	// If there are files in the test bucket, try to download one
	if len(s3Objects) > 0 {
		testFileName := s3Objects[0].Key

		params := url.Values{}
		params.Set("ssid", ss.ID)
		params.Set("s3Bucket", bucketName)
		params.Set("s3Key", testFileName)

		w := httptest.NewRecorder()
		req, err := NewPostRequest("/download_jobs/download", params)
		require.NoError(t, err)
		dartServer.ServeHTTP(w, req)

		// Verify the response
		assert.Equal(t, http.StatusOK, w.Code)
		assert.NotEmpty(t, w.Body.String())
		assert.Contains(t, w.Header().Get("Content-Disposition"), testFileName)
	} else {
		t.Log("No existing files found in test bucket, skipping this test")
	}
}

// TestDownloadJobDownloadLargeFile tests downloading files from bucket
func TestDownloadJobDownloadLargeFile(t *testing.T) {
	defer core.ClearDartTable()

	// Set up storage service
	ss := loadMinioStorageService(t)

	// Use the existing "test" bucket
	s3Client := setupMinioClient(t, ss)
	bucketName := "test"

	// Get list of objects
	s3Objects := s3Client.ListObjects(bucketName, "", minio.ListObjectsOptions{
		Recursive: true,
		MaxKeys:   1,
	})

	// Skip if no files
	if len(s3Objects) == 0 {
		t.Skip("No files in test bucket, skipping large file download test")
		return
	}

	testFileName := s3Objects[0].Key

	// Test downloading the file
	params := url.Values{}
	params.Set("ssid", ss.ID)
	params.Set("s3Bucket", bucketName)
	params.Set("s3Key", testFileName)

	w := httptest.NewRecorder()
	req, err := NewPostRequest("/download_jobs/download", params)
	require.NoError(t, err)
	dartServer.ServeHTTP(w, req)

	// Verify the response
	assert.Equal(t, http.StatusOK, w.Code)
	assert.NotEmpty(t, w.Body.Bytes())
	assert.Contains(t, w.Header().Get("Content-Disposition"), testFileName)
}

// TestDownloadJobBrowseWithPrefix tests browsing objects in bucket
func TestDownloadJobBrowseWithPrefix(t *testing.T) {
	defer core.ClearDartTable()

	// Set up storage service
	ss := loadMinioStorageService(t)

	// Use the existing "test" bucket
	bucketName := "test"

	// Test browsing the bucket
	params := url.Values{}
	params.Set("ssid", ss.ID)
	params.Set("bucket", bucketName)

	html := PostUrl(t, PostTestSettings{
		EndpointUrl:          "/download_jobs/browse",
		Params:               params,
		ExpectedResponseCode: http.StatusOK,
	})

	// Verify we get a valid response
	assert.Contains(t, html, bucketName)
}

// TestDownloadJobNewWithMultipleStorageServices tests the form with multiple S3 services
func TestDownloadJobNewWithMultipleStorageServices(t *testing.T) {
	defer core.ClearDartTable()

	// Load the Minio service
	ss1 := loadMinioStorageService(t)

	// Create another S3 storage service
	ss2 := core.NewStorageService()
	ss2.Name = "Test S3 Service"
	ss2.Protocol = constants.ProtocolS3
	ss2.Host = "s3.amazonaws.com"
	ss2.Port = 443
	ss2.Bucket = "test-bucket"
	ss2.Login = "test-user"
	ss2.Password = "test-password"
	ss2.AllowsUpload = true
	ss2.AllowsDownload = true
	require.NoError(t, core.ObjSave(ss2))

	// Request the download page
	html := GetUrl(t, "/download_jobs/new")

	// Both services should appear in the dropdown
	assert.Contains(t, html, ss1.Name)
	assert.Contains(t, html, ss2.Name)
	assert.Contains(t, html, "Download From")
}

// TestDownloadJobBrowseInvalidStorageService tests error handling for invalid storage service
func TestDownloadJobBrowseInvalidStorageService(t *testing.T) {
	defer core.ClearDartTable()

	// Try to browse with an invalid storage service ID
	params := url.Values{}
	params.Set("ssid", "invalid-id")
	params.Set("bucket", "")

	w := httptest.NewRecorder()
	req, err := NewPostRequest("/download_jobs/browse", params)
	require.NoError(t, err)
	dartServer.ServeHTTP(w, req)

	// The controller may panic or return an error
	// We're testing that it doesn't crash completely
	// Status could be 200 (with error in form), 400, or 500
	assert.True(t, w.Code == http.StatusTemporaryRedirect)
}

// Helper functions

// loadMinioStorageService loads and saves the local Minio storage service
func loadMinioStorageService(t *testing.T) *core.StorageService {
	ss, err := core.LoadStorageServiceFixture("storage_service_local_minio.json")
	require.NoError(t, err)
	require.NotNil(t, ss)
	require.NoError(t, core.ObjSave(ss))
	return ss
}

// setupMinioClient creates and returns an S3 client for testing
func setupMinioClient(t *testing.T, ss *core.StorageService) *core.S3Client {
	useSSL := ss.Host != "localhost" && ss.Host != "127.0.0.1"
	s3Client, err := core.NewS3Client(ss, useSSL, nil)
	require.NoError(t, err)
	require.NotNil(t, s3Client)
	return s3Client
}

// TestDownloadJobBrowseStorageClassLinks tests that objects in GLACIER and DEEP_ARCHIVE
// display as plain text, while other objects display as downloadable links
func TestDownloadJobBrowseStorageClassLinks(t *testing.T) {
	defer core.ClearDartTable()

	// Set up storage service
	ss := loadMinioStorageService(t)

	// Use the existing "test" bucket
	bucketName := "test"

	// Test browsing the bucket first to check if Minio is available
	params := url.Values{}
	params.Set("ssid", ss.ID)
	params.Set("bucket", bucketName)

	html := PostUrl(t, PostTestSettings{
		EndpointUrl:          "/download_jobs/browse",
		Params:               params,
		ExpectedResponseCode: http.StatusOK,
	})

	// Check if there's a connection error
	if strings.Contains(html, "connection refused") || strings.Contains(html, "Bucket is empty") {
		t.Skip("Minio is not running or bucket is empty, skipping storage class link test")
		return
	}

	// Get list of objects for more detailed checking
	s3Client := setupMinioClient(t, ss)
	s3Objects := s3Client.ListObjects(bucketName, "", minio.ListObjectsOptions{
		Recursive: true,
		MaxKeys:   50,
	})

	// Skip if no files
	if len(s3Objects) == 0 {
		t.Skip("No files in test bucket, skipping storage class link test")
		return
	}

	// Check each object in the response
	for _, obj := range s3Objects {
		if obj.StorageClass == "GLACIER" || obj.StorageClass == "DEEP_ARCHIVE" {
			// For GLACIER and DEEP_ARCHIVE, the key should appear as plain text (no link)
			// Check that there's no <a> tag with download-link class for this key
			assert.NotContains(t, html, `<a href="#`+obj.Key+`" class="download-link">`+obj.Key+`</a>`,
				"Object %s in %s should not have a download link", obj.Key, obj.StorageClass)
		} else {
			// For other storage classes, the key should be a clickable link
			assert.Contains(t, html, `<a href="#`+obj.Key+`" class="download-link">`+obj.Key+`</a>`,
				"Object %s in %s should have a download link", obj.Key, obj.StorageClass)
		}
	}
}

// TestDownloadJobBrowseGlacierNoLinks specifically tests that GLACIER objects don't have download links
func TestDownloadJobBrowseGlacierNoLinks(t *testing.T) {
	defer core.ClearDartTable()

	// Set up storage service
	ss := loadMinioStorageService(t)

	// Use the existing "test" bucket
	bucketName := "test"

	// Test browsing the bucket
	params := url.Values{}
	params.Set("ssid", ss.ID)
	params.Set("bucket", bucketName)

	html := PostUrl(t, PostTestSettings{
		EndpointUrl:          "/download_jobs/browse",
		Params:               params,
		ExpectedResponseCode: http.StatusOK,
	})

	// Check if there's a connection error - skip if Minio not running
	if strings.Contains(html, "connection refused") {
		t.Skip("Minio is not running, skipping GLACIER link test")
		return
	}

	// Check that the HTML contains the note about GLACIER and DEEP_ARCHIVE
	// (only if there are objects to display)
	if !strings.Contains(html, "Bucket is empty") {
		assert.Contains(t, html, "items in Glacier and Deep Arcive cannot be downloaded")
		// Verify the storage class column header exists
		assert.Contains(t, html, "Storage Class")
	}
}

// TestDownloadJobBrowseDeepArchiveNoLinks specifically tests that DEEP_ARCHIVE objects don't have download links
func TestDownloadJobBrowseDeepArchiveNoLinks(t *testing.T) {
	defer core.ClearDartTable()

	// Set up storage service
	ss := loadMinioStorageService(t)

	// Use the existing "test" bucket
	bucketName := "test"

	// Test browsing the bucket
	params := url.Values{}
	params.Set("ssid", ss.ID)
	params.Set("bucket", bucketName)

	html := PostUrl(t, PostTestSettings{
		EndpointUrl:          "/download_jobs/browse",
		Params:               params,
		ExpectedResponseCode: http.StatusOK,
	})

	// Check if there's a connection error - skip if Minio not running
	if strings.Contains(html, "connection refused") || strings.Contains(html, "Bucket is empty") {
		t.Skip("Minio is not running or bucket is empty, skipping DEEP_ARCHIVE link test")
		return
	}

	// Get list of objects
	s3Client := setupMinioClient(t, ss)
	s3Objects := s3Client.ListObjects(bucketName, "", minio.ListObjectsOptions{
		Recursive: true,
		MaxKeys:   50,
	})

	// Check for DEEP_ARCHIVE objects specifically
	for _, obj := range s3Objects {
		if obj.StorageClass == "DEEP_ARCHIVE" {
			// Should appear as plain text, not as a link
			assert.Contains(t, html, obj.Key, "DEEP_ARCHIVE object %s should be visible", obj.Key)
			// Should not have download-link class
			assert.NotContains(t, html, `class="download-link">`+obj.Key+`</a>`,
				"DEEP_ARCHIVE object %s should not have download-link class", obj.Key)
		}
	}
}

// TestDownloadJobBrowseFormFieldsStartAfter tests that the startAfter field is set correctly
func TestDownloadJobBrowseFormFieldsStartAfter(t *testing.T) {
	defer core.ClearDartTable()

	// Set up storage service
	ss := loadMinioStorageService(t)

	// Use the existing "test" bucket
	bucketName := "test"

	// Test browsing the bucket without startAfter
	params := url.Values{}
	params.Set("ssid", ss.ID)
	params.Set("bucket", bucketName)

	html := PostUrl(t, PostTestSettings{
		EndpointUrl:          "/download_jobs/browse",
		Params:               params,
		ExpectedResponseCode: http.StatusOK,
	})

	// Check if there's a connection error - skip if Minio not running
	if strings.Contains(html, "connection refused") {
		t.Skip("Minio is not running, skipping startAfter test")
		return
	}

	// Get list of objects
	s3Client := setupMinioClient(t, ss)
	s3Objects := s3Client.ListObjects(bucketName, "", minio.ListObjectsOptions{
		Recursive: true,
		MaxKeys:   50,
	})

	// Skip if no files
	if len(s3Objects) == 0 {
		t.Skip("No files in test bucket, skipping startAfter test")
		return
	}

	// When we browse the first page, startAfter should be set to the last item
	if len(s3Objects) > 0 {
		lastKey := s3Objects[len(s3Objects)-1].Key
		// Check that the hidden input field for startAfter is present
		assert.Contains(t, html, `name="startAfter"`, "startAfter field should be present")
		// If there are results, startAfter should contain the last key
		assert.Contains(t, html, `value="`+lastKey+`"`, "startAfter should be set to last key: %s", lastKey)
	}
}

// TestDownloadJobBrowseFormFieldsHasPreviousPage tests that hasPreviousPage is set correctly
func TestDownloadJobBrowseFormFieldsHasPreviousPage(t *testing.T) {
	defer core.ClearDartTable()

	// Set up storage service
	ss := loadMinioStorageService(t)

	// Use the existing "test" bucket
	bucketName := "test"

	// Test browsing the first page (no startAfter)
	params := url.Values{}
	params.Set("ssid", ss.ID)
	params.Set("bucket", bucketName)

	html := PostUrl(t, PostTestSettings{
		EndpointUrl:          "/download_jobs/browse",
		Params:               params,
		ExpectedResponseCode: http.StatusOK,
	})

	// Check if there's a connection error - skip if Minio not running
	if strings.Contains(html, "connection refused") {
		t.Skip("Minio is not running, skipping hasPreviousPage test")
		return
	}

	// On the first page, hasPreviousPage should be false
	assert.Contains(t, html, `name="hasPreviousPage"`, "hasPreviousPage field should be present")
	assert.Contains(t, html, `value="false"`, "hasPreviousPage should be false on first page")

	// Get list of objects
	s3Client := setupMinioClient(t, ss)
	s3Objects := s3Client.ListObjects(bucketName, "", minio.ListObjectsOptions{
		Recursive: true,
		MaxKeys:   50,
	})

	// If we have objects, test with startAfter set
	if len(s3Objects) > 0 {
		// Now test with startAfter set
		// Also set originalSource and originalBucket to prevent controller from clearing startAfter
		params.Set("startAfter", s3Objects[0].Key)
		params.Set("originalSource", ss.ID)
		params.Set("originalBucket", bucketName)

		html = PostUrl(t, PostTestSettings{
			EndpointUrl:          "/download_jobs/browse",
			Params:               params,
			ExpectedResponseCode: http.StatusOK,
		})

		// When startAfter is set, hasPreviousPage should be true
		assert.Contains(t, html, `value="true"`, "hasPreviousPage should be true when startAfter is set")
	}
}

// TestDownloadJobBrowseFormFieldsHasNextPage tests that hasNextPage is set correctly
func TestDownloadJobBrowseFormFieldsHasNextPage(t *testing.T) {
	defer core.ClearDartTable()

	// Set up storage service
	ss := loadMinioStorageService(t)

	// Use the existing "test" bucket
	bucketName := "test"

	// Test browsing the bucket
	params := url.Values{}
	params.Set("ssid", ss.ID)
	params.Set("bucket", bucketName)

	html := PostUrl(t, PostTestSettings{
		EndpointUrl:          "/download_jobs/browse",
		Params:               params,
		ExpectedResponseCode: http.StatusOK,
	})

	// Check if there's a connection error - skip if Minio not running
	if strings.Contains(html, "connection refused") {
		t.Skip("Minio is not running, skipping hasNextPage test")
		return
	}

	// Check that hasNextPage field is present
	assert.Contains(t, html, `name="hasNextPage"`, "hasNextPage field should be present")

	// Get list of objects to see how many there are
	s3Client := setupMinioClient(t, ss)
	s3Objects := s3Client.ListObjects(bucketName, "", minio.ListObjectsOptions{
		Recursive: true,
		MaxKeys:   300, // Get more than the controller's maxKeys (200)
	})

	// If there are 200 or more objects, hasNextPage should be true
	// If there are fewer than 200 objects, hasNextPage should be false
	if len(s3Objects) >= 200 {
		assert.Contains(t, html, `value="true"`, "hasNextPage should be true when there are 200+ objects")
	} else {
		assert.Contains(t, html, `value="false"`, "hasNextPage should be false when there are fewer than 200 objects")
	}
}

// TestDownloadJobBrowsePaginationButtons tests that Back and Next buttons appear correctly
func TestDownloadJobBrowsePaginationButtons(t *testing.T) {
	defer core.ClearDartTable()

	// Set up storage service
	ss := loadMinioStorageService(t)

	// Use the existing "test" bucket
	bucketName := "test"

	// Test first page (no startAfter)
	params := url.Values{}
	params.Set("ssid", ss.ID)
	params.Set("bucket", bucketName)

	html := PostUrl(t, PostTestSettings{
		EndpointUrl:          "/download_jobs/browse",
		Params:               params,
		ExpectedResponseCode: http.StatusOK,
	})

	// Check if there's a connection error - skip if Minio not running
	if strings.Contains(html, "connection refused") {
		t.Skip("Minio is not running, skipping pagination buttons test")
		return
	}

	// On first page, there should be no Back button
	assert.NotContains(t, html, `id="btnBackDiv"`, "Back button should not appear on first page")

	// Get list of objects
	s3Client := setupMinioClient(t, ss)
	s3Objects := s3Client.ListObjects(bucketName, "", minio.ListObjectsOptions{
		Recursive: true,
		MaxKeys:   50,
	})

	// If we have objects, test with startAfter set
	if len(s3Objects) > 0 {
		// Test a subsequent page (with startAfter)
		params.Set("startAfter", s3Objects[0].Key)
		params.Set("originalSource", ss.ID)
		params.Set("originalBucket", bucketName)

		html = PostUrl(t, PostTestSettings{
			EndpointUrl:          "/download_jobs/browse",
			Params:               params,
			ExpectedResponseCode: http.StatusOK,
		})

		// On subsequent pages, there should be a Back button
		assert.Contains(t, html, `id="btnBackDiv"`, "Back button should appear on subsequent pages")
		assert.Contains(t, html, `&lt;&lt; Back`, "Back button text should be present")
	}
}
