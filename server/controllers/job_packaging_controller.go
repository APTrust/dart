package controllers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/APTrust/dart-runner/constants"
	"github.com/APTrust/dart-runner/core"
	"github.com/gin-gonic/gin"
)

// GET /jobs/packaging/:id
func JobShowPackaging(c *gin.Context) {
	result := core.ObjFind(c.Param("id"))
	if result.Error != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, result.Error)
		return
	}
	job := result.Job()
	baggingDir, err := core.GetAppSetting(constants.BaggingDirectory)
	if err != nil {
		baggingDir = filepath.Join(core.Dart.Paths.Documents, "DART")
		core.Dart.Log.Warningf("Bagging Directory not set. Defaulting to %s", baggingDir)
	}

	var workflow *core.Workflow
	if job.WorkflowID != "" {
		result := core.ObjFind(job.WorkflowID)
		if result.Error != nil {
			core.Dart.Log.Warningf("While running workflow job, JobPackagingController could not find workflow with id %s", job.WorkflowID)
		} else {
			workflow = result.Workflow()
			job.PackageOp.BagItSerialization = workflow.Serialization
		}
	}

	data := gin.H{
		"job":                  job,
		"form":                 job.ToForm(),
		"pathSeparator":        string(os.PathSeparator),
		"baggingDir":           baggingDir,
		"autoSetSerialization": getSerlializationAutosets(),
		"helpUrl":              GetHelpUrl(c),
		"workflow":             workflow,
	}
	c.HTML(http.StatusOK, "job/packaging.html", data)
}

// POST /jobs/packaging/:id
func JobSavePackaging(c *gin.Context) {
	jobId := c.Param("id")
	direction := c.PostForm("direction")
	nextPage := fmt.Sprintf("/jobs/metadata/%s", jobId)
	if direction == "previous" {
		nextPage = fmt.Sprintf("/jobs/files/%s", jobId)
	}

	result := core.ObjFind(jobId)
	if result.Error != nil {
		AbortWithErrorHTML(c, http.StatusNotFound, result.Error)
		return
	}
	job := result.Job()
	job.PackageOp.BagItSerialization = c.PostForm("BagItSerialization")
	job.PackageOp.OutputPath = c.PostForm("OutputPath")
	job.PackageOp.PackageFormat = c.PostForm("PackageFormat")
	job.PackageOp.PackageName = c.PostForm("PackageName")

	bagItProfileID := c.PostForm("BagItProfileID")
	if bagItProfileID == "" {
		job.BagItProfile = nil
	} else if job.BagItProfile == nil || job.BagItProfile.ID != bagItProfileID {
		profileResult := core.ObjFind(bagItProfileID)
		if profileResult.Error != nil {
			err := fmt.Errorf("BagIt Profile: %s", result.Error.Error())
			AbortWithErrorHTML(c, http.StatusNotFound, err)
			return
		}
		job.BagItProfile = profileResult.BagItProfile()
	}

	if job.ValidationOp == nil {
		job.ValidationOp = core.NewValidationOperation(job.PackageOp.OutputPath)
	} else {
		job.ValidationOp.PathToBag = job.PackageOp.OutputPath
	}

	if direction == "next" {
		ok := job.PackageOp.Validate()
		if !ok {
			// Errors from sub-object have sub-object prefix for
			// display when running jobs from command line. We
			// want to strip that prefix here.
			errors := make(map[string]string)
			for key, value := range job.PackageOp.Errors {
				fieldName := strings.Replace(key, "PackageOperation.", "", 1)
				errors[fieldName] = value
			}
			job.Errors = errors
			form := job.ToForm()
			data := gin.H{
				"job":           job,
				"form":          form,
				"pathSeparator": string(os.PathSeparator),
				"helpUrl":       GetHelpUrl(c),
			}
			c.HTML(http.StatusBadRequest, "job/packaging.html", data)
			return
		}
	}
	// If direction == "previous", just save and go back.
	err := core.ObjSaveWithoutValidation(job)
	if err != nil {
		AbortWithErrorHTML(c, http.StatusInternalServerError, err)
		return
	}
	c.Redirect(http.StatusFound, nextPage)
}

func getSerlializationAutosets() map[string]string {
	autosetMap := make(map[string]string)
	// Typical installation has 3-10 profiles.
	result := core.ObjList(constants.TypeBagItProfile, "obj_name", 1000, 0)
	if result.Error != nil {
		core.Dart.Log.Warningf("Could not load BagIt profiles for serialization auto-set: %s", result.Error.Error())
		return autosetMap
	}
	for _, profile := range result.BagItProfiles {
		if profile.Serialization == constants.SerializationRequired && len(profile.AcceptSerialization) == 1 {
			autosetMap[profile.ID] = profile.AcceptSerialization[0]
		}
	}
	return autosetMap
}
