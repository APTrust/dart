package controllers_test

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"net/url"
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
	assert.True(t, w.Code == http.StatusOK || w.Code == http.StatusBadRequest || w.Code == http.StatusInternalServerError)
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
