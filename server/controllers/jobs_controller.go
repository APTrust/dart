package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/APTrust/dart-runner/constants"
	"github.com/APTrust/dart-runner/core"
	"github.com/gin-gonic/gin"
)

type JobListItem struct {
	Job       *core.Job
	Artifacts []core.NameIDPair
}

// PUT /jobs/delete/:id
// POST /jobs/delete/:id
func JobDelete(c *gin.Context) {
	jobID := c.Param("id")
	result := core.ObjFind(jobID)
	if result.Error != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, result.Error)
		return
	}
	err := core.ObjDelete(result.Job())
	if err != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, err)
		return
	}
	err = core.ArtifactsDeleteByJobID(jobID)
	if err != nil {
		deletionErr := fmt.Errorf("job was deleted but artifacts were not: %v", err)
		AbortWithErrorHTML(c, http.StatusInternalServerError, deletionErr)
		return
	}
	SetFlashCookie(c, fmt.Sprintf("Deleted job %s.", result.Job().Name()))
	c.Redirect(http.StatusFound, "/jobs")
}

// GET /jobs
func JobIndex(c *gin.Context) {
	request := NewRequest(c)
	if request.HasErrors() {
		AbortWithErrorHTML(c, http.StatusInternalServerError, request.Errors[0])
		return
	}
	request.TemplateData["jobs"] = request.QueryResult.Jobs
	c.HTML(http.StatusOK, "job/list.html", request.TemplateData)
}

// GET /jobs/new
func JobNew(c *gin.Context) {
	job := core.NewJob()
	err := core.ObjSaveWithoutValidation(job)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}
	c.Redirect(http.StatusFound, fmt.Sprintf("/jobs/files/%s", job.ID))
}

// JobShowJson displays a job's raw JSON data. Note that
// this mimics JobArtifactShow and even uses the same
// template. This method converts the Job JSON into a mock
// artifact to simplify the front-end display. We do not
// save the mock artifact because job records belong only
// in the dart table, not in the artifacts table.
//
// GET /jobs/show_json/:id
func JobShowJson(c *gin.Context) {
	jobID := c.Param("id")
	result := core.ObjFind(jobID)
	if result.Error != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, result.Error)
		return
	}
	job := result.Job()

	// Get artifacts list to show in side bar.
	artifacts, err := core.ArtifactListByJobID(jobID)
	if err != nil {
		core.Dart.Log.Warningf("Error getting artifact list for job %s: %v", jobID, err)
	}

	// Make this job look like an artifact, so we can render it.
	jsonData, err := json.MarshalIndent(job, "", "  ")
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, result.Error)
		return
	}
	updatedAt := job.Outcome().LastActivity
	if updatedAt.IsZero() {
		updatedAt = time.Now().UTC()
	}
	artifact := &core.Artifact{
		ID:        "n/a",
		JobID:     jobID,
		BagName:   job.Name(),
		ItemType:  constants.ItemTypeFile,
		FileName:  "Raw Job Description",
		RawData:   string(jsonData),
		UpdatedAt: updatedAt,
	}

	data := gin.H{
		"artifact":               artifact,
		"artifacts":              artifacts,
		"helpUrl":                GetHelpUrl(c),
		"job":                    result.Job(),
		"displayAsFormattedJSON": true,
	}
	c.HTML(http.StatusOK, "job/artifact.html", data)
}
