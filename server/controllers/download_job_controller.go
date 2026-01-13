package controllers

import (
	"fmt"
	"net/http"

	"github.com/APTrust/dart-runner/constants"
	"github.com/APTrust/dart-runner/core"
	"github.com/gin-gonic/gin"
	"github.com/minio/minio-go/v7"
)

// GET /download_jobs/new
func DownloadJobNew(c *gin.Context) {
	form, _ := GetS3DownloadForm(c)
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
	s3ObjectListDisplay := "none"
	if c.PostForm("bucket") != "" {
		s3ObjectListDisplay = "block"
	}
	templateData := gin.H{
		"form":                form,
		"s3Objects":           s3Objects,
		"s3ObjectListDisplay": s3ObjectListDisplay,
		"helpUrl":             GetHelpUrl(c),
	}
	c.HTML(http.StatusOK, "download_job/index.html", templateData)
}

// POST /download_jobs/browse
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
		attachmentName := fmt.Sprintf("attachment; filename=%s", s3Key)
		c.DataFromReader(
			http.StatusOK,
			stats.Size,
			stats.ContentType,
			s3Object,
			map[string]string{
				"Content-Disposition": attachmentName,
			},
		)
	}
}

func GetDownloadFile(ssid, s3Bucket, s3Key string) (*minio.Object, minio.ObjectInfo, error) {
	var obj *minio.Object
	stats := minio.ObjectInfo{}
	ss := core.ObjFind(ssid).StorageService()
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
	selectedBucket := c.PostForm("bucket")
	startAfter := c.PostForm("startAfter")

	storageServices := core.ObjList(constants.TypeStorageService, "obj_name", 1000, 0).StorageServices
	choices := []core.Choice{
		{Label: "Choose One", Value: "", Selected: false},
	}
	for _, ss := range storageServices {
		if ss.Protocol == constants.ProtocolS3 {
			choices = append(choices, core.Choice{Label: ss.Name, Value: ss.ID, Selected: ssid == ss.ID})
		}
	}
	form := core.NewForm("Download", "", make(map[string]string))
	ssidField := form.AddField("ssid", "Download From", ssid, true)
	ssidField.Choices = choices

	bucketField := form.AddField("bucket", "Bucket", selectedBucket, false)
	if ssid == "" {
		bucketField.FormGroupClass = "form-group-hidden"
	} else {
		ss := core.ObjFind(ssid).StorageService()
		useSSL := ss.Host != "localhost" && ss.Host != "127.0.0.1"
		s3Client, err := core.NewS3Client(ss, useSSL, nil)
		if err != nil {
			bucketField.Error = err.Error()
			return form, s3Objects
		} else {
			buckets, err := s3Client.ListBuckets()
			if err != nil {
				bucketField.Error = err.Error()
				return form, s3Objects
			} else {
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
		for _, s3Obj := range s3Client.ListObjects(selectedBucket, "", minio.ListObjectsOptions{
			Recursive:  true,
			MaxKeys:    200,
			StartAfter: startAfter,
		}) {
			s3Objects = append(s3Objects, s3Obj)
		}
	}
	return form, s3Objects
}
