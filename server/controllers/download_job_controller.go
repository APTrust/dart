package controllers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/APTrust/dart-runner/constants"
	"github.com/APTrust/dart-runner/core"
	"github.com/gin-gonic/gin"
	"github.com/minio/minio-go/v7"
)

var IsRunningWails = false

// GET /download_jobs/new
func DownloadJobNew(c *gin.Context) {
	form, _ := GetS3DownloadForm(c)
	if form == nil {
		// An error occurred and request was redirected.
		return
	}
	templateData := gin.H{
		"form":                form,
		"s3Objects":           []minio.ObjectInfo{},
		"s3ObjectListDisplay": "none",
		"helpUrl":             GetHelpUrl(c),
	}
	c.HTML(http.StatusOK, "download_job/index.html", templateData)
}

// POST /download_jobs/browse
func DownloadJobBrowse(c *gin.Context) {
	form, s3Objects := GetS3DownloadForm(c)
	if form == nil {
		// An error occurred and request was redirected.
		return
	}

	// If the user has selected a bucket, or if there is only one bucket
	// in the list, we want to display the list of objects in that bucket.
	s3ObjectListDisplay := "none"
	if c.PostForm("bucket") != "" || len(form.Fields["bucket"].Choices) == 1 {
		s3ObjectListDisplay = "block"
	}

	hasPreviousPage := form.Fields["hasPreviousPage"].Value == "true"
	hasNextPage := form.Fields["hasNextPage"].Value == "true"
	templateData := gin.H{
		"form":                form,
		"s3Objects":           s3Objects,
		"s3ObjectListDisplay": s3ObjectListDisplay,
		"helpUrl":             GetHelpUrl(c),
		"hasPreviousPage":     hasPreviousPage,
		"hasNextPage":         hasNextPage,
	}
	c.HTML(http.StatusOK, "download_job/index.html", templateData)
}

// POST /download_jobs/download
func DownloadJobDownload(c *gin.Context) {
	ssid := c.PostForm("ssid")
	s3Bucket := c.PostForm("s3Bucket")
	s3Key := c.PostForm("s3Key")
	s3Object, stats, err := GetDownloadFile(ssid, s3Bucket, s3Key)
	if err != nil {
		core.Dart.Log.Errorf("S3 download error: %v", err)
		data := gin.H{
			"error": err.Error(),
		}
		c.HTML(http.StatusInternalServerError, "download_job/error.html", data)
	} else {
		if IsRunningWails {
			// We're running in a Wails window, so we have to save this
			// file directly from the back end. When Wails adds JS support
			// for SaveFileDialog, we can open a dialog on the front end
			// instead. Check https://wails.io/docs/reference/runtime/dialog/
			// periodically to see when support for SaveFileDialog is
			// available.
			downloadFolder := core.Dart.Paths.Downloads
			fileName := strings.ReplaceAll(s3Key, "/", "_")
			fileName = strings.ReplaceAll(fileName, "\\", "_")
			downloadFile := filepath.Join(downloadFolder, fileName)

			// Create the destination file
			destFile, err := os.Create(downloadFile)
			if err != nil {
				core.Dart.Log.Errorf("Failed to create file: %v", err)
				c.String(http.StatusInternalServerError, fmt.Sprintf("Failed to create file: %v", err))
				return
			}
			defer destFile.Close()

			// Copy s3Object contents to the file
			_, err = io.Copy(destFile, s3Object)
			if err != nil {
				core.Dart.Log.Errorf("Failed to write file: %v", err)
				c.String(http.StatusInternalServerError, fmt.Sprintf("Failed to write file: %v", err))
				return
			}

			message := fmt.Sprintf("Downloaded %s to %s", s3Key, downloadFile)
			core.Dart.Log.Infof(message)
			templateData := gin.H{
				"downloadFile":   downloadFile,
				"downloadFolder": downloadFolder,
			}
			c.HTML(http.StatusOK, "download_job/completed.html", templateData)
			return
		} else {
			// We're running in a browser.
			// Note: Setting content-type to application/octet-stream is a hack
			// to prevent Wails from opening the file in the current window.
			// Without this setting, text files, images, and some other will open
			// in the main application window on Mac.
			attachmentName := fmt.Sprintf("attachment; filename=%s", s3Key)
			c.DataFromReader(
				http.StatusOK,
				stats.Size,
				stats.ContentType,
				s3Object,
				map[string]string{
					"Content-Disposition": attachmentName,
					"Content-Type":        "application/octet-stream",
				},
			)
		}
	}
}

func GetDownloadFile(ssid, s3Bucket, s3Key string) (*minio.Object, minio.ObjectInfo, error) {
	var obj *minio.Object
	stats := minio.ObjectInfo{}
	ss := core.ObjFind(ssid).StorageService()
	if ss == nil {
		return obj, stats, fmt.Errorf("No such storage service: %s", ssid)
	}
	useSSL := ss.Host != "localhost" && ss.Host != "127.0.0.1"
	s3Client, err := core.NewS3Client(ss, useSSL, nil)
	if err != nil {
		return obj, stats, err
	}
	obj, err = s3Client.GetObject(s3Bucket, s3Key, minio.GetObjectOptions{})
	if err != nil {
		return obj, stats, err
	}
	stats, err = obj.Stat()
	return obj, stats, err
}

func GetS3DownloadForm(c *gin.Context) (*core.Form, []minio.ObjectInfo) {
	s3Objects := make([]minio.ObjectInfo, 0)
	ssid := c.PostForm("ssid")
	originalSource := c.PostForm("originalSource")
	selectedBucket := c.PostForm("bucket")
	originalBucket := c.PostForm("originalBucket")
	startAfter := c.PostForm("startAfter")

	// If user changed the S3 service or the bucket name, clear out
	// startAfter, because that applied to the old S3 bucket.
	if ssid != originalSource || selectedBucket != originalBucket {
		startAfter = ""
	}

	storageServices := core.ObjList(constants.TypeStorageService, "obj_name", 100, 0).StorageServices
	choices := []core.Choice{
		{Label: "Choose One", Value: "", Selected: false},
	}
	for _, ss := range storageServices {
		if ss.Protocol == constants.ProtocolS3 {
			choices = append(choices, core.Choice{Label: ss.Name, Value: ss.ID, Selected: ssid == ss.ID})
		}
	}

	// Reset our form values.
	form := core.NewForm("Download", "", make(map[string]string))
	ssidField := form.AddField("ssid", "Download From", ssid, true)
	ssidField.Choices = choices
	bucketField := form.AddField("bucket", "Bucket", selectedBucket, false)

	// startAfter will tell us where to start the list of objects
	// when the user clicks Next to view the next page of results.
	startAfterField := form.AddField("startAfter", "", startAfter, false)

	// hasPreviousPage tells us whether we should display a button
	// linking back to the previous page of results. The startAfter
	// field is empty only when the user requests the first page of
	// results, so if startAfter is empty, there is no previous page.
	hasPreviousPage := strconv.FormatBool(startAfter != "")
	form.AddField("hasPreviousPage", "", hasPreviousPage, false)

	// hasNextPage will be true if there are more results to list.
	// We set the proper value below.
	hasNextPageField := form.AddField("hasNextPage", "", "true", false)

	// Keep track of the user's current selection, so we'll know if
	// the source or bucket changed on the next request.
	form.AddField("originalSource", "", ssid, false)
	form.AddField("originalBucket", "", selectedBucket, false)

	// If user did not select a storage service (ssid), don't show
	// the bucket drop-down. If they did select a storage service,
	// populate the bucket list drop-down and display it.
	if ssid == "" {
		bucketField.FormGroupClass = "form-group-hidden"
	} else {
		ss := core.ObjFind(ssid).StorageService()
		if ss == nil {
			SetFlashCookie(c, "S3 endpoint not found.")
			c.Redirect(http.StatusTemporaryRedirect, c.Request.Referer())
			return nil, nil
		}
		useSSL := ss.Host != "localhost" && ss.Host != "127.0.0.1"
		s3Client, err := core.NewS3Client(ss, useSSL, nil)
		if err != nil {
			bucketField.Error = err.Error()
			return form, s3Objects
		} else {
			buckets, err := s3Client.ListBuckets()
			if err != nil {
				core.Dart.Log.Warningf("Cannot list buckets: %v. Will list only configured bucket for this storage service.")
				bucketChoices := []core.Choice{
					{Label: ss.Bucket, Value: ss.Bucket, Selected: true},
				}
				bucketField.Choices = bucketChoices
				// Since we have only one choice, select it.
				selectedBucket = ss.Bucket
			} else {
				// Show all available buckets, if possible.
				bucketChoices := []core.Choice{
					{Label: "Choose One", Value: "", Selected: false},
				}
				for _, bucket := range buckets {
					choice := core.Choice{
						Label:    bucket.Name,
						Value:    bucket.Name,
						Selected: bucket.Name == selectedBucket,
					}
					bucketChoices = append(bucketChoices, choice)
				}
				bucketField.Choices = bucketChoices
			}
		}

		maxKeys := 200
		if selectedBucket != "" {
			// Note that ListObjects should honor the MaxKeys option.
			for _, s3Obj := range s3Client.ListObjects(selectedBucket, startAfter, minio.ListObjectsOptions{
				Recursive:  true,
				MaxKeys:    maxKeys,
				StartAfter: startAfter,
			}) {
				// If the minio client can't get a list of objects, in some cases
				// it returns a single s3Obj containing an error explaining why it
				// can't get the object. We don't want to return that because it
				// shows up on the front end as a zero-byte object with no name, and
				// it can't be downloaded. So, lets log that as an error instead of
				// making the user puzzle over the presence of a non-name, zero-byte,
				// inaccessible object.
				if s3Obj.Err != nil {
					core.Dart.Log.Errorf("Error listing objects for bucket %s: %v", selectedBucket, s3Obj.Err)
				} else {
					s3Objects = append(s3Objects, s3Obj)
				}
			}

			// Set the value of the startAfter form field, so when the
			// requests the next page of results, we know where to start.
			if len(s3Objects) == 0 {
				startAfterField.Value = ""
			} else {
				startAfterField.Value = s3Objects[len(s3Objects)-1].Key
			}

			// If we didn't get a full list of results, there will be no
			// next page. If we did get a full list, there will probably
			// be more results.
			hasNextPageField.Value = strconv.FormatBool(len(s3Objects) == maxKeys)
		}
	}
	return form, s3Objects
}
