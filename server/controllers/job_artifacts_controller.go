package controllers

import (
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"

	"github.com/APTrust/dart-runner/constants"
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

// GET /jobs/artifacts/:id
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

	_, outputFile, err := ArtifactOutputDirAndFileName(artifact)
	if err != nil {
		AbortWithErrorModal(c, http.StatusInternalServerError, err)
		return
	}

	displayAsFormattedJSON := artifact.FileName == "Job Result" || strings.HasSuffix(artifact.FileName, ".json")

	data := gin.H{
		"artifact":               artifact,
		"artifacts":              artifacts,
		"helpUrl":                GetHelpUrl(c),
		"job":                    result.Job(),
		"outputFile":             outputFile,
		"displayAsFormattedJSON": displayAsFormattedJSON,
	}
	c.HTML(http.StatusOK, "job/artifact.html", data)
}

// GET /jobs/artifacts/save/:artifact_id
// Saves an artifact (tag file, manifest or job result) to a file on disk.
func JobArtifactSave(c *gin.Context) {
	artifact, err := core.ArtifactFind(c.Param("id"))
	if err != nil {
		AbortWithErrorModal(c, http.StatusNotFound, err)
		return
	}
	outputDir, outputFile, err := ArtifactOutputDirAndFileName(artifact)
	if err != nil {
		AbortWithErrorModal(c, http.StatusInternalServerError, err)
		return
	}
	file, err := os.Create(outputFile)
	if err != nil {
		AbortWithErrorModal(c, http.StatusInternalServerError, err)
		return
	}
	defer file.Close()
	_, err = file.WriteString(artifact.RawData)
	if err != nil {
		AbortWithErrorModal(c, http.StatusInternalServerError, err)
		return
	}
	data := gin.H{
		"artifact":   artifact,
		"outputDir":  outputDir,
		"outputFile": outputFile,
	}
	c.HTML(http.StatusCreated, "job/artifact_saved_modal.html", data)
}

func ArtifactOutputDirAndFileName(artifact *core.Artifact) (string, string, error) {
	baggingDir, err := core.GetAppSetting(constants.BaggingDirectory)
	if err != nil {
		baggingDir = filepath.Join(core.Dart.Paths.Documents, "DART")
		core.Dart.Log.Warningf("Bagging Directory not set. Defaulting to %s", baggingDir)
	}
	outputDir := path.Join(baggingDir, artifact.BagName, "logs")
	err = os.MkdirAll(outputDir, 0755)
	if err != nil {
		return "", "", err
	}
	outputFile := path.Join(outputDir, artifact.FileName)
	if artifact.FileName == "Job Result" {
		outputFile = path.Join(outputDir, "JobResult.json")
	}
	return outputDir, outputFile, err
}
