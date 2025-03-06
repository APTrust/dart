package controllers

import (
	"net/http"
	"strings"

	"github.com/APTrust/dart-runner/core"
	"github.com/gin-gonic/gin"
)

// GET /jobs/artifacts/list/:job_id
func JobArtifactsList(c *gin.Context) {
	jobID := c.Param("job_id")
	artifacts, err := core.ArtifactListByJobID(jobID)
	if err != nil {
		core.Dart.Log.Warningf("Error getting artifact list for job %s: %v", jobID, err)
	}
	result := core.ObjFind(jobID)
	if result.Error != nil {
		core.Dart.Log.Warningf("Cannot find job with ID %s: %v", jobID, err)
	}
	data := gin.H{
		"artifacts": artifacts,
		"helpUrl":   GetHelpUrl(c),
		"job":       result.Job(),
	}
	c.HTML(http.StatusOK, "job/artifact.html", data)
}

// GET /jobs/artifact/:id
func JobArtifactShow(c *gin.Context) {
	artifact, err := core.ArtifactFind(c.Param("id"))
	if err != nil {
		AbortWithErrorModal(c, http.StatusNotFound, err)
		return
	}
	artifacts, err := core.ArtifactListByJobID(artifact.JobID)
	if err != nil {
		core.Dart.Log.Warningf("Error getting artifact list for job %s: %v", artifact.JobID, err)
	}
	result := core.ObjFind(artifact.JobID)
	if result.Error != nil {
		core.Dart.Log.Warningf("Cannot find job with ID %s: %v", artifact.JobID, err)
	}

	displayAsFormattedJSON := artifact.FileName == "Job Result" || strings.HasSuffix(artifact.FileName, ".json")

	data := gin.H{
		"artifact":               artifact,
		"artifacts":              artifacts,
		"helpUrl":                GetHelpUrl(c),
		"job":                    result.Job(),
		"displayAsFormattedJSON": displayAsFormattedJSON,
	}
	c.HTML(http.StatusOK, "job/artifact.html", data)
}
